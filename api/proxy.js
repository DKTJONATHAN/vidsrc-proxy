// Vercel Proxy 2026 - Native Fetch Version
export default async function handler(req, res) {
    const targetBase = "https://vidsrc.xyz";
    const url = new URL(req.url, `https://${req.headers.host}`);
    
    // We want to proxy everything after the root to vidsrc.xyz
    const targetUrl = targetBase + url.pathname + url.search;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Referer': targetBase,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send(`Vidsrc Error: ${response.statusText}`);
        }

        let html = await response.text();

        // Ad-Killer Script
        const adShield = `
        <script>
            (function() {
                window.open = function() { return null; };
                const killAds = () => {
                    document.querySelectorAll('script[src*="ads"], script[src*="pop"], iframe[src*="ads"]').forEach(el => el.remove());
                };
                setInterval(killAds, 1500);
            })();
        </script>`;

        // Fix paths and inject shield
        html = html.replace('<head>', '<head>' + adShield)
                   .replaceAll('src="/', `src="${targetBase}/`)
                   .replaceAll('href="/', `href="${targetBase}/`);

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(html);

    } catch (error) {
        console.error("Proxy Crash:", error);
        return res.status(500).json({ error: "Proxy Failed", message: error.message });
    }
}// Vercel Serverless Function Proxy
const fetch = require('node-fetch');

export default async function handler(req, res) {
    const targetBase = "https://vidsrc.xyz";
    // Construct the target URL (e.g., /embed/movie/123)
    const targetUrl = targetBase + req.url;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Referer': targetBase,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        let html = await response.text();

        // Ad-Blocking Script to inject
        const adShield = `
        <script>
            (function() {
                window.open = function() { return null; };
                const killer = () => {
                    document.querySelectorAll('script[src*="ads"], script[src*="pop"], iframe[src*="ads"]').forEach(el => el.remove());
                };
                setInterval(killer, 1000);
            })();
        </script>`;

        // Fix paths so images/CSS load from vidsrc, not your local server
        html = html.replace('<head>', '<head>' + adShield)
                   .split('src="/').join(`src="${targetBase}/`)
                   .split('href="/').join(`href="${targetBase}/`);

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(html);

    } catch (error) {
        return res.status(500).send("Proxy Error: " + error.message);
    }
}