import { route } from "remix/routes";

export const routes = route({
  frames: {
    home: "/",
    protected: "/protected",
  },
});
