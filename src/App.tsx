import { useState, useCallback } from "react";
import { useStorage } from "./hooks/useStorage";
import { Header } from "./components/Header";
import { TabNav } from "./components/TabNav";
import { DailyEntry } from "./components/DailyEntry";
import { Summary } from "./components/Summary";
import { History } from "./components/History";
import { Settings } from "./components/Settings";
import { Toast } from "./components/Toast";
import { getToday } from "./utils/date";

export default function App() {
  const { data, save, reset, loading } = useStorage();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }));
  }, []);

  const handleEditDate = useCallback((date: string) => {
    setSelectedDate(date);
    setActiveTab(0);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <>
      <Header data={data} />
      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 0 && (
        <DailyEntry
          data={data}
          onSave={save}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onToast={showToast}
        />
      )}
      {activeTab === 1 && <Summary data={data} />}
      {activeTab === 2 && (
        <History
          data={data}
          onSave={save}
          onEditDate={handleEditDate}
          onToast={showToast}
        />
      )}
      {activeTab === 3 && (
        <Settings
          data={data}
          onSave={save}
          onReset={reset}
          onToast={showToast}
        />
      )}

      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />
    </>
  );
}
