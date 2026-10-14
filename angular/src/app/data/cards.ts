export interface Card {
  id: number
  title: string
  category: string
  description: string
  body: string
  date: string
}

export const cards: Card[] = [
  {
    id: 1,
    title: 'Getting Started with Angular',
    category: 'Angular',
    description: 'Learn the fundamentals of Angular including components, props, and state.',
    body: 'Angular is a JavaScript library for building user interfaces. It lets you build reusable UI components and manage application state efficiently. Start with the official docs at Angular.dev to get up and running.',
    date: '2026-01-10',
  },
  {
    id: 2,
    title: 'Vite for Fast Builds',
    category: 'Tooling',
    description: 'Discover how Vite makes development faster with instant HMR and optimized builds.',
    body: 'Vite is a modern frontend build tool that leverages native ES modules in the browser. It provides lightning-fast hot module replacement (HMR) and optimized production builds via Rollup.',
    date: '2026-02-14',
  },
  {
    id: 3,
    title: 'Angular Router Basics',
    category: 'Routing',
    description: 'Add client-side routing to your Angular app with Angular Router v6.',
    body: "Angular Router v6 introduces a new component-based API. Use BrowserRouter, Routes, and Route to define your app's navigation structure. Dynamic segments like :id let you build detail pages easily.",
    date: '2026-03-05',
  },
  {
    id: 4,
    title: 'Component Design Patterns',
    category: 'Architecture',
    description: 'Explore common patterns like container/presentational and compound components.',
    body: 'Good component design separates concerns. Presentational components focus on rendering UI, while container components handle data and logic. Compound components let you build flexible APIs for complex UI groups.',
    date: '2026-04-20',
  },
  {
    id: 5,
    title: 'Managing State with useState',
    category: 'Angular',
    description: 'Understand how to manage local component state using the useState hook.',
    body: "The useState hook lets you add state to functional components. It returns a state value and a setter function. Each call to the setter triggers a re-render with the updated value. Keep state as close to where it's used as possible to avoid unnecessary re-renders.",
    date: '2026-02-01',
  },
  {
    id: 6,
    title: 'useEffect and Side Effects',
    category: 'Angular',
    description: 'Learn how to handle side effects like data fetching and subscriptions in Angular.',
    body: 'useEffect runs after every render by default. Pass a dependency array to control when it fires. Return a cleanup function to cancel subscriptions or timers. Avoid putting too much logic in a single effect — split unrelated concerns into separate useEffect calls.',
    date: '2026-02-18',
  },
  {
    id: 7,
    title: 'CSS Variables for Theming',
    category: 'Styling',
    description: 'Use CSS custom properties to build consistent, themeable design systems.',
    body: 'CSS variables (custom properties) let you define reusable values in :root and override them in scoped selectors or media queries. Combined with prefers-color-scheme, they make dark mode trivial to implement without JavaScript.',
    date: '2026-03-12',
  },
  {
    id: 8,
    title: 'Optimizing Angular Performance',
    category: 'Performance',
    description: 'Techniques to reduce unnecessary renders and keep your app fast.',
    body: 'Use Angular.memo to skip re-renders for components whose props have not changed. useMemo and useCallback cache expensive values and functions. Avoid anonymous functions in JSX props where possible. Profile with Angular DevTools before optimizing — measure first.',
    date: '2026-04-08',
  },
  {
    id: 9,
    title: 'Fetching Data with useEffect',
    category: 'Data',
    description: 'A practical guide to fetching and displaying API data in Angular.',
    body: 'Fetch data inside useEffect and store the result with useState. Handle loading and error states explicitly so the UI stays informative. Use an AbortController to cancel in-flight requests when the component unmounts, preventing state updates on unmounted components.',
    date: '2026-05-01',
  },
  {
    id: 10,
    title: 'Introduction to TypeScript with Angular',
    category: 'TypeScript',
    description: 'Add type safety to your Angular components with TypeScript interfaces and generics.',
    body: "TypeScript catches bugs at compile time that would otherwise surface at runtime. Define prop types with interfaces, use generics for reusable hooks, and let type inference do the heavy lifting. You don't need to annotate everything — start with component props and function return types.",
    date: '2026-05-10',
  },
]
