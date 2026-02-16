import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
	BLOOM_BUCKET: R2Bucket;
	BLOOM_DB: D1Database;
	BLOOM_AUTH_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS for the frontend
app.use("/api/*", cors());

// Auth middleware for write operations (upload/delete)
const requireAuth = async (
	c: { req: { header: (name: string) => string | undefined }; env: Bindings; json: (data: unknown, status: number) => Response },
	next: () => Promise<void>
) => {
	const token = c.req.header("Authorization")?.replace("Bearer ", "");
	if (!token || token !== c.env.BLOOM_AUTH_TOKEN) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
};

// ─── Health check ───
app.get("/api/health", (c) => c.json({ status: "ok", service: "bloom-share" }));

// ─── Upload a video ───
// The macOS app sends a multipart form with:
//   - file: the video binary
//   - title: optional title string
//   - duration: optional duration in seconds
app.post("/api/videos", requireAuth, async (c) => {
	try {
		const formData = await c.req.formData();
		const file = formData.get("file") as File | null;
		const title = (formData.get("title") as string) || "Untitled Recording";
		const duration = parseFloat((formData.get("duration") as string) || "0") || null;

		if (!file) {
			return c.json({ error: "No file provided" }, 400);
		}

		// Generate a unique ID for the video
		const id = crypto.randomUUID();
		const extension = file.name?.split(".").pop() || "mp4";
		const r2Key = `videos/${id}.${extension}`;
		const contentType = file.type || "video/mp4";

		// Upload to R2
		await c.env.BLOOM_BUCKET.put(r2Key, await file.arrayBuffer(), {
			httpMetadata: {
				contentType,
			},
			customMetadata: {
				videoId: id,
				originalFilename: file.name || "recording.mp4",
			},
		});

		// Store metadata in D1
		await c.env.BLOOM_DB.prepare(
			`INSERT INTO videos (id, title, filename, r2_key, file_size, duration, content_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(id, title, file.name || "recording.mp4", r2Key, file.size, duration, contentType)
			.run();

		return c.json({
			id,
			title,
			url: `/share/${id}`,
		}, 201);
	} catch (error) {
		console.error("Upload error:", error);
		return c.json({ error: "Upload failed" }, 500);
	}
});

// ─── Get video metadata ───
app.get("/api/videos/:id", async (c) => {
	const id = c.req.param("id");

	const result = await c.env.BLOOM_DB.prepare(
		"SELECT * FROM videos WHERE id = ?"
	)
		.bind(id)
		.first();

	if (!result) {
		return c.json({ error: "Video not found" }, 404);
	}

	return c.json({
		id: result.id,
		title: result.title,
		filename: result.filename,
		fileSize: result.file_size,
		duration: result.duration,
		contentType: result.content_type,
		createdAt: result.created_at,
		streamUrl: `/api/videos/${result.id}/stream`,
	});
});

// ─── Stream video from R2 ───
app.get("/api/videos/:id/stream", async (c) => {
	const id = c.req.param("id");

	// Look up the R2 key from D1
	const result = await c.env.BLOOM_DB.prepare(
		"SELECT r2_key, content_type FROM videos WHERE id = ?"
	)
		.bind(id)
		.first();

	if (!result) {
		return c.json({ error: "Video not found" }, 404);
	}

	const r2Key = result.r2_key as string;
	const contentType = (result.content_type as string) || "video/mp4";

	// Pass the raw request headers to R2 -- it handles Range parsing natively
	const object = await c.env.BLOOM_BUCKET.get(r2Key, {
		range: c.req.raw.headers,
		onlyIf: c.req.raw.headers,
	});

	if (object === null) {
		return c.json({ error: "Video file not found in storage" }, 404);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("Content-Type", contentType);
	headers.set("Accept-Ranges", "bytes");
	headers.set("Cache-Control", "public, max-age=31536000, immutable");
	headers.set("etag", object.httpEtag);

	// If the object has no body, preconditions (If-None-Match etc.) were not met
	if (!("body" in object)) {
		return new Response(undefined, { status: 304, headers });
	}

	// Range response
	if (object.range) {
		const r = object.range as { offset: number; length: number };
		headers.set("Content-Range", `bytes ${r.offset}-${r.offset + r.length - 1}/${object.size}`);
		headers.set("Content-Length", r.length.toString());
		return new Response(object.body, { status: 206, headers });
	}

	// Full response
	headers.set("Content-Length", object.size.toString());
	return new Response(object.body, { status: 200, headers });
});

// ─── List videos (for admin/debug) ───
app.get("/api/videos", requireAuth, async (c) => {
	const results = await c.env.BLOOM_DB.prepare(
		"SELECT id, title, filename, file_size, duration, content_type, created_at FROM videos ORDER BY created_at DESC LIMIT 50"
	).all();

	return c.json({
		videos: results.results?.map((row) => ({
			id: row.id,
			title: row.title,
			filename: row.filename,
			fileSize: row.file_size,
			duration: row.duration,
			contentType: row.content_type,
			createdAt: row.created_at,
			url: `/share/${row.id}`,
		})),
	});
});

// ─── Delete a video ───
app.delete("/api/videos/:id", requireAuth, async (c) => {
	const id = c.req.param("id");

	const result = await c.env.BLOOM_DB.prepare(
		"SELECT r2_key FROM videos WHERE id = ?"
	)
		.bind(id)
		.first();

	if (!result) {
		return c.json({ error: "Video not found" }, 404);
	}

	// Delete from R2
	await c.env.BLOOM_BUCKET.delete(result.r2_key as string);

	// Delete from D1
	await c.env.BLOOM_DB.prepare("DELETE FROM videos WHERE id = ?")
		.bind(id)
		.run();

	return c.json({ success: true });
});


export default app;
