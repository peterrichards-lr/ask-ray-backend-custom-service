import { Router } from "express"
import { getAuthToken } from "../controllers/googleAuthController"

const router: Router = Router()

router.get('/auth', getAuthToken)

export default router