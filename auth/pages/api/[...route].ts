import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";
import { z } from "zod";

export const config = {
	runtime: "edge",
};

const app = new Hono().basePath("/api");

app.use(
	"*",
	cors({
		origin: "app://obsidian.md",
		credentials: true,
	})
);

const bodySchema = z.object({
	code: z.string(),
});

app.onError((err, c) => {
	console.error({ err: err.message, time: new Date().toISOString() });
	return c.json({ error: err.message }, 500);
});

// redirect /auth to localhost
app.get("/auth", async (c) => {
	const query = c.req.query();

	return c.redirect("http://localhost:3000/auth?code=" + query.code);
});

app.post("/token", async (c) => {
	// validate body
	const bodyRaw = await c.req.json();
	const body = bodySchema.parse(bodyRaw);

	const url = new URL("https://dev.are.na/oauth/token");

	console.log({
		ARENA_CALLBACK_URL: process.env.ARENA_CALLBACK_URL,
		ARENA_ID: process.env.ARENA_ID,
		ARENA_SECRET: process.env.ARENA_SECRET,
	});

	url.searchParams.set("client_id", process.env.ARENA_ID!);
	url.searchParams.set("client_secret", process.env.ARENA_SECRET!);
	url.searchParams.set("code", body.code);
	url.searchParams.set("grant_type", "authorization_code");
	url.searchParams.set("redirect_uri", process.env.ARENA_CALLBACK_URL!);

	// fetch token
	const token = await fetch(url.toString(), {
		method: "POST",
	});

	// return token
	return c.json(await token.json());
});

export default handle(app);
