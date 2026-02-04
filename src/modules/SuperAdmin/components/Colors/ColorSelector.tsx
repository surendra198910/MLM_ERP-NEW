
import { HexColorPicker } from "react-colorful";

const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFC107", "#6f42c1", "#0dcaf0"];

export default function ColorSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="space-y-2">

      {/* Main Color Picker */}
      <HexColorPicker color={value} onChange={onChange} />

      {/* Hex Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 border rounded px-2 py-1 w-full"
      />

      {/* Predefined Colors */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {colors.map((c) => (
          <div
            key={c}
            onClick={() => onChange(c)}
            className="w-7 h-7 rounded cursor-pointer border"
            style={{ background: c }}
          />
        ))}
      </div>

    </div>
  );
}

