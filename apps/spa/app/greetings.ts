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

export function clearGreetings() {
  greetings = [];
}
