import { createHonoServer } from "react-router-hono-server/node";
import { Tracker } from "~/lib/modules/tracker";

Tracker.start();

export default await createHonoServer({
  onServe() {
    console.log("hello");
  },
});
