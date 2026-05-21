import { Router, type IRouter } from "express";
import healthRouter from "./health";
import destinationsRouter from "./destinations";
import usersRouter from "./users";
import guidesRouter from "./guides";
import treksRouter from "./treks";
import analyticsRouter from "./analytics";
import reviewsRouter from "./reviews";
import wishlistsRouter from "./wishlists";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/destinations", destinationsRouter);
router.use("/destinations/:destinationId/reviews", reviewsRouter);
router.use("/users", usersRouter);
router.use("/guides", guidesRouter);
router.use("/wishlists", wishlistsRouter);
router.use("/treks", treksRouter);
router.use("/analytics", analyticsRouter);

export default router;
