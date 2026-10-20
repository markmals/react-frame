export interface Greeting {
  id: string;
  name: string;
}

// The demo keeps its data in memory, so it resets whenever the document loads.
let greetings: Greeting[] = [];

export function addGreeting(name: string) {
  greetings = [{ id: crypto.randomUUID(), name }, ...greetings].slice(0, 5);
}

export function listGreetings() {
  return greetings;
}

// Shaped like a server function, so the same form action works if this app moves to a server.
export async function clearGreetings() {
  greetings = [];
}
