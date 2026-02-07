import React from "react";
import Card from "./Card.jsx";
import Modal from "../../shared/components/Modal.jsx";
import Button from "../../shared/components/Button.jsx";
import { useEscapeKey } from "../../shared/hooks/useEscapeKey.js";
import "./PlacementChoiceModal.css";

const PlacementChoiceModal = ({ isOpen, card, availablePositions = [], onChoose, onCancel }) => {
  useEscapeKey(isOpen, onCancel);

  if (!isOpen || !card) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Choose placement position">
      <div className="placement-choice-modal">
        <p className="modal-helper">This number is already validated. Place this card face-down on any empty space.</p>
        <p className="modal-subtext">Pick an open slot (1–9) to tuck this card.</p>

        <div className="placement-card">
          <Card card={card} />
        </div>

        <div className="position-grid">
          {Array.from({ length: 9 }, (_, index) => (
            <Button
              key={index}
              variant={availablePositions.includes(index) ? "primary" : "secondary"}
              disabled={!availablePositions.includes(index)}
              onClick={() => availablePositions.includes(index) && onChoose(index)}
              className="position-button"
            >
              {index + 1}
            </Button>
          ))}
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

export default PlacementChoiceModal;
