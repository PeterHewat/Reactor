declare module "@repo/utils" {
  export type ClassValue =
    | string
    | number
    | false
    | null
    | undefined
    | ClassValue[]
    | { [key: string]: boolean };

  export function cn(...classes: ClassValue[]): string;
}
