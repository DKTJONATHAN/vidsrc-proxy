// api/proxy.js
export default async function handler(req, res) {
    const targetBase = "https://vidsrc.xyz";
    
    // 1. Build the target URL
    // req.url includes the path and query string (e.g., /embed/movie?tmdb=123)
    const targetUrl = targetBase + req.url;

    try {
        // 2. Fetch using Node's built-in fetch (No 'require' needed)
        const response = await fetch(targetUrl, {
            headers: {
                'Referer': targetBase,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send(`Source returned ${response.status}`);
        }

        let html = await response.text();

        // 3. The Ad-Killer Shield
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

        // 4. Clean the HTML and fix paths
        html = html.replace('<head>', '<head>' + adShield)
                   .split('src="/').join(`src="${targetBase}/`)
                   .split('href="/').join(`href="${targetBase}/`);

        // 5. Send Response
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(html);

    } catch (error) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: "Invocation Failed", details: error.message });
    }
}