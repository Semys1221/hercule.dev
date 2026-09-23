import { SequenceCommunicationEditor } from "@/components/engin/communication/sequence-communication-editor";

export default function CommunicationSequencesPage() {
  return (
    <div className="flex flex-col gap-4 overflow-auto p-6 pt-4">
      <SequenceCommunicationEditor />
    </div>
  );
}
