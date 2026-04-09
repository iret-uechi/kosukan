import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(__dirname, "..", "data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const CSV_PATH = path.join(DATA_DIR, "workload.csv");
const MAX_BACKUPS = 20;

const CSV_HEADER = "日付,カテゴリID,カテゴリ名,グループID,時間(h),人日,人月,メモ";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// タイムスタンプ付きバックアップを作成し、古い世代を削除
function backup(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  ensureBackupDir();
  const basename = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupName = `${basename}_${ts}${ext}`;
  fs.copyFileSync(filePath, path.join(BACKUP_DIR, backupName));
  pruneBackups(basename, ext);
}

// 同一ファイル種別のバックアップを直近 MAX_BACKUPS 件に維持
function pruneBackups(basename: string, ext: string) {
  const prefix = `${basename}_`;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith(ext))
    .sort();
  while (files.length > MAX_BACKUPS) {
    const oldest = files.shift()!;
    fs.unlinkSync(path.join(BACKUP_DIR, oldest));
  }
}

function readBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

export function csvApiPlugin(): Plugin {
  return {
    name: "csv-api",
    configureServer(server) {
      // GET /api/data — CSVファイルの内容を返す
      server.middlewares.use("/api/data", async (req, res, next) => {
        if (req.method === "GET") {
          ensureDataDir();
          if (fs.existsSync(CSV_PATH)) {
            const content = fs.readFileSync(CSV_PATH, "utf-8");
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.end(content);
          } else {
            // ファイルが無い場合はヘッダーのみ
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.end(CSV_HEADER + "\n");
          }
          return;
        }

        if (req.method === "POST") {
          try {
            const body = await readBody(req);
            const { csv } = JSON.parse(body) as { csv: string };
            ensureDataDir();
            backup(CSV_PATH);
            fs.writeFileSync(CSV_PATH, csv, "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        next();
      });

      // GET /api/plans — 計画値JSONの読み込み
      server.middlewares.use("/api/plans", async (req, res, next) => {
        const plansPath = path.join(DATA_DIR, "plans.json");

        if (req.method === "GET") {
          ensureDataDir();
          if (fs.existsSync(plansPath)) {
            const content = fs.readFileSync(plansPath, "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.end(content);
          } else {
            res.setHeader("Content-Type", "application/json");
            res.end("null");
          }
          return;
        }

        if (req.method === "POST") {
          try {
            const body = await readBody(req);
            ensureDataDir();
            backup(plansPath);
            fs.writeFileSync(plansPath, body, "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        next();
      });
    },
  };
}
