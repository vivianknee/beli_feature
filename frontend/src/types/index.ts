export interface Place {
  name: string;
  type: string | null;
  confidence: number;
  source: string;
}

export interface ExtractResponse {
  places: Place[];
  video_title: string | null;
}

export const LIST_TYPES = [
  "Restaurants",
  "Bars",
  "Bakeries",
  "Coffee & Tea",
  "Ice Cream & Dessert",
];

export function defaultListType(type: string | null): string {
  if (!type) return "Restaurants";
  const map: Record<string, string> = {
    restaurant: "Restaurants",
    bar: "Bars",
    bakery: "Bakeries",
    cafe: "Coffee & Tea",
    food_stall: "Restaurants",
  };
  return map[type] ?? "Restaurants";
}
