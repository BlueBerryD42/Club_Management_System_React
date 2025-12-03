import { twMerge } from "tailwind-merge";

type ClassDictionary = { [id: string]: any };
type ClassValue = string | number | boolean | null | undefined | ClassDictionary | ClassValue[];

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  const handle = (input: ClassValue) => {
    if (!input) return;
    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      input.forEach(handle);
    } else if (typeof input === "object") {
      for (const key in input as ClassDictionary) {
        if (Object.prototype.hasOwnProperty.call(input, key) && (input as ClassDictionary)[key]) {
          classes.push(key);
        }
      }
    }
  };

  inputs.forEach(handle);
  return classes.join(" ");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
