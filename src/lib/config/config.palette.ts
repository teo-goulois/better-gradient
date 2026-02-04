import type { RgbHex } from "@/types/types.mesh";

export type PalettePreset = {
  title: string;
  category:
    | "Soft Pastels"
    | "Bold & Saturated"
    | "Earth & Naturals"
    | "Coastal & Cool"
    | "Dark & Moody"
    | "Playful & Pop";
  colors: RgbHex["color"][];
};

export const palettePresets: PalettePreset[] = [
  {
    title: "Cloud Sorbet",
    category: "Soft Pastels",
    colors: ["#FFF7FB", "#FADDE1", "#F7D9C4", "#F2E2BA", "#DCEAE7"],
  },
  {
    title: "Powder Room",
    category: "Soft Pastels",
    colors: ["#F8F7FF", "#E8DAFF", "#D1C4E9", "#CDE7FF", "#B8C0FF"],
  },
  {
    title: "Peachy Breeze",
    category: "Soft Pastels",
    colors: ["#FFF4EE", "#FAD2C2", "#F6C59E", "#EFD9C3", "#CDE4F6"],
  },
  {
    title: "Mint Macaron",
    category: "Soft Pastels",
    colors: ["#F2FFFA", "#CFF4E3", "#A8E6CF", "#BEE3F8", "#FFD6E0"],
  },
  {
    title: "Lavender Milk",
    category: "Soft Pastels",
    colors: ["#FAF7FF", "#E9DCF7", "#D0C1E8", "#CDE0F5", "#F7D6E0"],
  },
  {
    title: "Morning Linen",
    category: "Soft Pastels",
    colors: ["#F9F6F1", "#E7DFD8", "#D3C7B8", "#C7D7D1", "#B8C9D3"],
  },
  {
    title: "Aurora Field",
    category: "Bold & Saturated",
    colors: ["#F6F8FF", "#8FD3FF", "#5AD2C0", "#F2C94C", "#F26B6B"],
  },
  {
    title: "Horizon Pop",
    category: "Bold & Saturated",
    colors: [
      "#F9FBFF",
      "#3D5AF1",
      "#22D1EE",
      "#FBB13C",
      "#F66D44",
      "#222831",
    ],
  },
  {
    title: "Arcade Punch",
    category: "Bold & Saturated",
    colors: [
      "#FFF5F5",
      "#FF595E",
      "#FFCA3A",
      "#8AC926",
      "#1982C4",
      "#6A4C93",
    ],
  },
  {
    title: "Electric Orchid",
    category: "Bold & Saturated",
    colors: ["#FDF7FF", "#FF6BD6", "#7C4DFF", "#00E5FF", "#FFB703"],
  },
  {
    title: "Hyper Citrus",
    category: "Bold & Saturated",
    colors: [
      "#FFFAE6",
      "#FFD166",
      "#F6AE2D",
      "#F26419",
      "#662E9B",
      "#0E7C7B",
    ],
  },
  {
    title: "Cobalt Pop",
    category: "Bold & Saturated",
    colors: ["#F5F7FF", "#4D65FF", "#2EC4B6", "#FFB703", "#FB5607"],
  },
  {
    title: "Vivid Tropic",
    category: "Bold & Saturated",
    colors: ["#F5FFF7", "#06D6A0", "#1B9AAA", "#EF476F", "#FFD166"],
  },
  {
    title: "Studio Terra",
    category: "Earth & Naturals",
    colors: ["#FFF7F0", "#E0A96D", "#8B5E3C", "#2E4057", "#83A2A9"],
  },
  {
    title: "Desert Relay",
    category: "Earth & Naturals",
    colors: ["#FFF4E6", "#F4A261", "#E76F51", "#2A9D8F", "#264653"],
  },
  {
    title: "Moss & Clay",
    category: "Earth & Naturals",
    colors: ["#F4F1EA", "#DDBEA9", "#B08968", "#7F5539", "#6B705C"],
  },
  {
    title: "Olive Orchard",
    category: "Earth & Naturals",
    colors: [
      "#F6F7F2",
      "#DAD7CD",
      "#A3B18A",
      "#588157",
      "#3A5A40",
      "#C9ADA7",
    ],
  },
  {
    title: "Timberline",
    category: "Earth & Naturals",
    colors: ["#F0F1EC", "#C7C1A3", "#A28F6A", "#6B4F3F", "#2F2E2B"],
  },
  {
    title: "Lagoon Lift",
    category: "Coastal & Cool",
    colors: ["#F1FBF9", "#7ED6C5", "#23A6D5", "#2D3E50", "#FAD06A"],
  },
  {
    title: "Marina Bright",
    category: "Coastal & Cool",
    colors: [
      "#F5FBFF",
      "#74B3CE",
      "#50858B",
      "#2C3E50",
      "#F2B880",
      "#E76F51",
    ],
  },
  {
    title: "Coastal Mist",
    category: "Coastal & Cool",
    colors: ["#F2FAFB", "#C9ECEC", "#8FD2D6", "#4FAAB3", "#2F6F7B"],
  },
  {
    title: "Glacier Pop",
    category: "Coastal & Cool",
    colors: ["#F3FAFF", "#76B5C5", "#1B4965", "#CA054D", "#F4D35E"],
  },
  {
    title: "Charcoal Bloom",
    category: "Dark & Moody",
    colors: [
      "#14181C",
      "#242B33",
      "#3A4652",
      "#566676",
      "#B28A63",
      "#E2C2A3",
    ],
  },
  {
    title: "Deep Teal",
    category: "Dark & Moody",
    colors: ["#0F1B1E", "#1D2E33", "#2F4750", "#4E6C78", "#8FB3C2", "#E3B892"],
  },
  {
    title: "Midnight Ink",
    category: "Dark & Moody",
    colors: ["#0B0D12", "#1D2230", "#2C3648", "#4E5D75", "#BFA07A"],
  },
  {
    title: "Noir Plum",
    category: "Dark & Moody",
    colors: ["#120E1A", "#2A1F33", "#4A2C59", "#8E6A94", "#E3B5A4"],
  },
  {
    title: "Blueberry Soda",
    category: "Playful & Pop",
    colors: ["#F6F7FF", "#7F8CFF", "#3F51B5", "#FF6F91", "#FFD166"],
  },
  {
    title: "Coastal Sunrise",
    category: "Playful & Pop",
    colors: ["#FFF5EC", "#FBC4AB", "#FEC89A", "#A9DEF9", "#6C91BF"],
  },
  {
    title: "Spritz & Mint",
    category: "Playful & Pop",
    colors: ["#FFF7F1", "#FF8C61", "#F6C28B", "#6BCB77", "#4D96FF"],
  },
  {
    title: "Berry Coast",
    category: "Playful & Pop",
    colors: [
      "#F9F1FF",
      "#D881C5",
      "#9E579D",
      "#6A0572",
      "#1B1B3A",
      "#F7B267",
      "#70C1B3",
    ],
  },
];
