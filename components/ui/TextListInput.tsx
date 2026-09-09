import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";
import { Input } from "./Input";

export interface TextListInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  addButtonLabel?: string;
}

/**
 * A plain, numbered, reorderable list of full-text entries — not a tag/chip
 * input. Use this instead of TagsInput whenever entries are free text that
 * may itself contain a separator character like "," or ";" (e.g. institution
 * names, addresses, multi-clause labels) — a tag-splitter would silently
 * commit those as separate entries the moment that character is typed.
 * Reordering is move up/down rather than drag-and-drop, since these lists
 * are typically short and this keeps the component dependency-free and
 * keyboard-accessible.
 */
export function TextListInput({
  value,
  onChange,
  label,
  placeholder = "Add an item...",
  addButtonLabel = "Add",
}: TextListInputProps) {
  const updateItem = (index: number, next: string) => {
    onChange(value.map((item, i) => (i === index ? next : item)));
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="form-control w-full">
      {label && (
        <label className="label pb-2">
          <span className="label-text font-medium">{label}</span>
        </label>
      )}
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm text-base-content/50 w-5 shrink-0 text-right">{index + 1}.</span>
            <Input
              placeholder={placeholder}
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => moveItem(index, -1)}
              disabled={index === 0}
              title="Move Up"
            >
              <ChevronUpIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => moveItem(index, 1)}
              disabled={index === value.length - 1}
              title="Move Down"
            >
              <ChevronDownIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-error hover:bg-error/10"
              size="sm"
              onClick={() => removeItem(index)}
              title="Remove"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...value, ""])}>
          <PlusIcon className="w-4 h-4 mr-1" />
          {addButtonLabel}
        </Button>
      </div>
    </div>
  );
}
