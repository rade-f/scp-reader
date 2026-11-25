import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

export const CONFIG = {
    PORT: parseInt(process.env.PORT || "3001", 10),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyBjiQsuYJNixPjEx2jjEHplMyGL9Ild2uM",
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    CN_DOMAIN: "https://scp-wiki-cn.wikidot.com",
    EN_DOMAIN: "https://scp-wiki.wikidot.com",
    PROXY: process.env.HTTP_PROXY || process.env.http_proxy || "http://127.0.0.1:7890",
    DB_PATH: path.join(__dirname, "../scp_cache.db")
};
