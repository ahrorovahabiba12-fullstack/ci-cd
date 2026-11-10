
import { readFile, writeFile, access } from "fs/promises";
import { createServer } from "http";
import { join } from "path";

const usersPath = join(process.cwd(), "users.json");
const postsPath = join(process.cwd(), "posts.json");

// JSON fayllar mavjudligini tekshirish
for (const path of [usersPath, postsPath]) {
    try {
        await access(path);
    } catch {
        await writeFile(path, "[]");
    }
}

const app = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");

    try {
        const parts = req.url.split("/");
        const id = Number(parts[2]);

        if (req.method === "GET" && req.url === "/users") {
            const data = await readFile(usersPath, "utf-8");
            const users = data ? JSON.parse(data) : [];

            return res.writeHead(200).end(JSON.stringify(users));
        }

        if (
            req.method === "GET" &&
            parts[1] === "user" &&
            parts.length === 3 &&
            parts[2] !== "" &&
            Number.isInteger(id) &&
            id > 0
        ) {
            const data = await readFile(usersPath, "utf-8");
            const users = data ? JSON.parse(data) : [];

            const user = users.find((item) => item.id === id);

            if (!user) {
                return res.writeHead(404).end(
                    JSON.stringify({ message: "User not found" })
                );
            }

            return res.writeHead(200).end(JSON.stringify(user));
        }

        if (req.method === "POST" && req.url === "/user") {
            let body = "";

            req.on("data", (chunk) => {
                body += chunk;
            });

            req.on("end", async () => {
                try {
                    const data = await readFile(usersPath, "utf-8");
                    const users = data ? JSON.parse(data) : [];

                    const newUser = {
                        ...JSON.parse(body),
                        id: users.length ? users.at(-1).id + 1 : 1
                    };

                    users.push(newUser);

                    await writeFile(
                        usersPath,
                        JSON.stringify(users, null, 2)
                    );

                    res.writeHead(201).end(JSON.stringify(newUser));
                } catch {
                    res.writeHead(400).end(
                        JSON.stringify({ message: "Xatolik" })
                    );
                }
            });

            return;
        }

        if (
            req.method === "PUT" &&
            parts[1] === "user" &&
            parts.length === 3 &&
            parts[2] !== "" &&
            Number.isInteger(id) &&
            id > 0
        ) {
            let body = "";

            req.on("data", (chunk) => {
                body += chunk;
            });

            req.on("end", async () => {
                try {
                    const data = await readFile(usersPath, "utf-8");
                    const users = data ? JSON.parse(data) : [];

                    const index = users.findIndex((el) => el.id === id);

                    if (index === -1) {
                        return res.writeHead(404).end(
                            JSON.stringify({ message: "User not found" })
                        );
                    }

                    users[index] = {
                        ...users[index],
                        ...JSON.parse(body),
                        id
                    };

                    await writeFile(
                        usersPath,
                        JSON.stringify(users, null, 2)
                    );

                    res.writeHead(200).end(JSON.stringify(users[index]));
                } catch {
                    res.writeHead(400).end(
                        JSON.stringify({ message: "Invalid JSON" })
                    );
                }
            });

            return;
        }

        if (
            req.method === "DELETE" &&
            parts[1] === "user" &&
            parts.length === 3 &&
            parts[2] !== "" &&
            Number.isInteger(id) &&
            id > 0
        ) {
            const usersData = await readFile(usersPath, "utf-8");
            const users = usersData ? JSON.parse(usersData) : [];

            if (!users.some((u) => u.id === id)) {
                return res.writeHead(404).end(
                    JSON.stringify({ message: "User not found" })
                );
            }

            const postsData = await readFile(postsPath, "utf-8");
            const posts = postsData ? JSON.parse(postsData) : [];

            await writeFile(
                usersPath,
                JSON.stringify(users.filter((u) => u.id !== id), null, 2)
            );

            await writeFile(
                postsPath,
                JSON.stringify(posts.filter((p) => p.userId !== id), null, 2)
            );

            return res.writeHead(204).end();
        }

        // ---------------- POST ----------------

        if (
            req.method === "GET" &&
            parts[1] === "user" &&
            parts.length === 4 &&
            parts[3] === "posts" &&
            parts[2] !== "" &&
            Number.isInteger(id) &&
            id > 0
        ) {
            const postsData = await readFile(postsPath, "utf-8");
            const posts = postsData ? JSON.parse(postsData) : [];

            const result = posts.filter((p) => p.userId === id);

            return res.writeHead(200).end(JSON.stringify(result));
        }

        if (req.method === "POST" && req.url === "/post") {
            let body = "";

            req.on("data", (chunk) => {
                body += chunk;
            });

            req.on("end", async () => {
                try {
                    const { title, content, userId } = JSON.parse(body);

                    const usersData = await readFile(usersPath, "utf-8");
                    const users = usersData ? JSON.parse(usersData) : [];

                    const author = users.find((u) => u.id === userId);

                    if (!author) {
                        return res.writeHead(404).end(
                            JSON.stringify({ message: "User not found" })
                        );
                    }

                    const postsData = await readFile(postsPath, "utf-8");
                    const posts = postsData ? JSON.parse(postsData) : [];

                    const newPost = {
                        id: posts.length ? posts.at(-1).id + 1 : 1,
                        title,
                        content,
                        userId
                    };

                    posts.push(newPost);

                    await writeFile(
                        postsPath,
                        JSON.stringify(posts, null, 2)
                    );

                    res.writeHead(201).end(JSON.stringify(newPost));
                } catch {
                    res.writeHead(400).end(
                        JSON.stringify({ message: "Invalid JSON" })
                    );
                }
            });

            return;
        }

        if (
            req.method === "GET" &&
            parts[1] === "post" &&
            parts.length === 3 &&
            parts[2] !== "" &&
            Number.isInteger(id) &&
            id > 0
        ) {
            const postsData = await readFile(postsPath, "utf-8");
            const posts = postsData ? JSON.parse(postsData) : [];

            const post = posts.find((el) => el.id === id);

            if (!post) {
                return res.writeHead(404).end(
                    JSON.stringify({ message: "Post not found" })
                );
            }

            const usersData = await readFile(usersPath, "utf-8");
            const users = usersData ? JSON.parse(usersData) : [];

            const author = users.find((u) => u.id === post.userId);

            return res.writeHead(200).end(
                JSON.stringify({ ...post, author })
            );
        }

        return res.writeHead(404).end(
            JSON.stringify({ message: "Page not found" })
        );

    } catch (err) {
        console.error(err);

        res.writeHead(500).end(
            JSON.stringify({ message: "Server error" })
        );
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
