import { NotificationCommunicationEditor } from "@/components/engin/communication/notification-communication-editor";

export default function CommunicationNotificationsPage() {
  return (
    <div className="flex flex-col gap-4 overflow-auto p-6 pt-4">
      <NotificationCommunicationEditor />
    </div>
  );
}
