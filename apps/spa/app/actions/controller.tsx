import { createController } from "remix/router";

import { addGreeting, listGreetings } from "../greetings.ts";
import { routes } from "../routes.ts";
import { AboutPage, GreetingPage, HomePage } from "./pages.tsx";
import { RecentGreetings } from "./recent-greetings.tsx";
import { sleep } from "./sleep.ts";

export default createController(routes, {
  actions: {
    async home({ render, request, url }) {
      await sleep(700, request.signal);
      return render(<HomePage url={url} />);
    },
    async about({ render, request, url }) {
      await sleep(700, request.signal);
      return render(<AboutPage url={url} />);
    },
    greet({ render, url }) {
      return render(<GreetingPage name="friend" url={url} />);
    },
    async submitGreet({ render, request, url }) {
      let formData = await request.formData();
      let value = formData.get("name");
      let name = typeof value === "string" && value.trim() !== "" ? value.trim() : "friend";
      await sleep(700, request.signal);
      addGreeting(name);
      return render(<GreetingPage isSubmission name={name} url={url} />);
    },
    async greetings({ render, request }) {
      await sleep(300, request.signal);
      return render(<RecentGreetings greetings={listGreetings()} />);
    },
  },
});
