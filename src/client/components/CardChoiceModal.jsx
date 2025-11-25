import React, { useEffect } from "react";
import Card from "./Card.jsx";
import Modal from "../../shared/components/Modal.jsx";
import Button from "../../shared/components/Button.jsx";
import "./CardChoiceModal.css";

const CardChoiceModal = ({ isOpen, existingCard, newCard, onChoose, onCancel }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen || !newCard) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Choose which card to keep face-up">
      <div className="card-choice-modal">
        <p className="modal-helper">
          Both cards will stay validated. Pick which one stays on top for this number ({newCard.value}).
        </p>

        <div className="card-choices">
          <div className="choice-option" onClick={() => onChoose("keep-existing")}>
            <div className="choice-header">
              <h4>Keep Existing Card</h4>
              <span className="choice-subtext">Keeps placement, validates beneath card</span>
            </div>
            {existingCard && <Card card={existingCard} />}
          </div>

          <div className="vs-divider">
            <span className="vs-text">VS</span>
          </div>

          <div className="choice-option" onClick={() => onChoose("keep-new")}>
            <div className="choice-header">
              <h4>Use New Card</h4>
              <span className="choice-subtext">Places new art on top, still validated</span>
            </div>
            <Card card={newCard} />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CardChoiceModal;
