const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const Car = (p) => (
  <svg {...base} {...p}><path d="M5 16h14M4 16v-3.5L6 8a2 2 0 0 1 1.8-1.2h8.4A2 2 0 0 1 18 8l2 4.5V16" /><path d="M4 12.5h16" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /></svg>
);
export const Bike = (p) => (
  <svg {...base} {...p}><circle cx="5.5" cy="16" r="3" /><circle cx="18.5" cy="16" r="3" /><path d="M5.5 16 9 9h5l4.5 7M9 9 8 6.5H6M14 9l-2.5 7H5.5M14.5 6h2l1 3" /></svg>
);
export const Spark = (p) => (
  <svg {...base} {...p}><path d="M12 3c.4 3.9 2.1 5.6 6 6-3.9.4-5.6 2.1-6 6-.4-3.9-2.1-5.6-6-6 3.9-.4 5.6-2.1 6-6Z" /><path d="M19 15c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z" /></svg>
);
export const Back = (p) => (<svg {...base} {...p}><path d="M15 5 8 12l7 7" /></svg>);
export const Close = (p) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Plus = (p) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const Minus = (p) => (<svg {...base} {...p}><path d="M5 12h14" /></svg>);
export const Search = (p) => (<svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>);
export const Navigate = (p) => (<svg {...base} {...p}><path d="M4 11.5 20 4l-7.5 16-2-6.5z" /></svg>);
export const Pin = (p) => (<svg {...base} {...p}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>);
export const Send = (p) => (<svg {...base} {...p}><path d="M5 12h13M13 6l6 6-6 6" /></svg>);
export const Locate = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>);
