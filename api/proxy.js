// Vercel Serverless Function Proxy
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