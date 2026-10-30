import { DOCUMENT_ATTESTATION_STATEMENTS, type DocumentAttestations } from '@recoveryos/domain';
export function DocumentAttestationFields({
  value,
  onChange,
  disabled = false,
  paper = false,
}: {
  value: DocumentAttestations;
  onChange: (value: DocumentAttestations) => void;
  disabled?: boolean;
  paper?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-3">
      <legend className="mb-3 font-semibold">
        {paper
          ? 'Statements the participant selected on this paper document'
          : 'Your acknowledgment of this document'}
      </legend>
      {DOCUMENT_ATTESTATION_STATEMENTS.map(({ key, label }) => (
        <label key={key} className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={value[key]}
            onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
            className="mt-1"
          />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
