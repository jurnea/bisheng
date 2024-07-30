import { useContext, useEffect, useState } from "react";
import { PopUpContext } from "@/contexts/popUpContext";
import GenericModal from "@/modals/genericModal";
import { TextAreaComponentType } from "@/types/components";
import { TypeModal } from "@/utils";

import { ExternalLink } from "lucide-react";

export default function PromptAreaComponent({
  field_name,
  setNodeClass,
  nodeClass,
  value,
  onChange,
  disabled,
  editNode = false,
  type = TypeModal.PROMPT,
}: TextAreaComponentType) {
  const [myValue, setMyValue] = useState(value);
  const { openPopUp } = useContext(PopUpContext);
  useEffect(() => {
    if (disabled) {
      setMyValue("");
      onChange("");
    }
  }, [disabled, onChange]);

  const handleSave = (t: string) => {
    setMyValue(t);
    onChange(t);
  };

  return (
    <div className={disabled ? "pointer-events-none w-full " : "w-full"}>
      <div className="flex w-full items-center">
        <span
          onClick={() => {
            openPopUp(
              <GenericModal
                type={type}
                value={myValue}
                buttonText="check & Save"
                modalTitle="Edit Prompt"
                setValue={(t: string) => {
                  setMyValue(t);
                  onChange(t);
                }}
                nodeClass={nodeClass}
                setNodeClass={setNodeClass}
              />
            );
          }}
          className={
            editNode
              ? "input-edit-node input-dialog"
              : (disabled ? " input-disable text-ring " : "") +
                " whitespace-wrap input-primary"
          }
        >
          {myValue !== "" ? myValue : "enter your prompt"}
        </span>
        <button
          onClick={() => {
            openPopUp(
              <GenericModal
                field_name={field_name}
                type={TypeModal.PROMPT}
                value={myValue}
                buttonText="check & Save"
                modalTitle="Edit Prompt"
                setValue={handleSave}
                nodeClass={nodeClass}
                setNodeClass={setNodeClass}
              />
            );
          }}
        >
          {!editNode && (
            <ExternalLink
              strokeWidth={1.5}
              className={
                "icons-parameters-comp" +
                (disabled ? " text-ring" : " hover:text-accent-foreground")
              }
            />
          )}
        </button>
      </div>
    </div>
  );
}
