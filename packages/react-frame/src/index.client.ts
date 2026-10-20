// What `react-frame` resolves to outside React Server Components, such as a single-page
// app: the same `<Frame>`, resolved in the browser through the runtime's `resolveFrame` hook.
export { FrameLoader as Frame } from "./frame-loader.tsx";
