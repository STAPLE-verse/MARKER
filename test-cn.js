const { twMerge } = require('tailwind-merge');
const { clsx } = require('clsx');

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

console.log(cn("dropdown", "dropdown-end"));
