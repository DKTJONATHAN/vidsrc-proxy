// api/proxy.js - 2026 Domain Update
export default async function handler(req, res) {
    // Switching to the domain recommended in their announcement
    const targetBase = "https://vidsrc-embed.su"; 
    
    // Safety check: ensure we aren't fetching the root landing page
    if (!req.url || req.url === "/" || req.url.includes("api/proxy")) {
        return res.status(400).send("No TMDB ID provided. Usage: /embed/movie/ID");
    }

    const targetUrl = targetBase + req.url;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Referer': targetBase,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType.includes('text/html')) {
            let html = await response.text();
            
            // Script to neutralize ads within the proxied HTML
            const adShield = `
            <script>
                (function() {
                    window.open = function() { return null; };
                    const killAds = () => {
                        document.querySelectorAll('script[src*="ads"], script[src*="pop"], iframe[src*="ads"]').forEach(el => el.remove());
                    };
                    setInterval(killAds, 750);
                })();
            </script>`;

            // Inject shield and map relative paths to the new .su domain
            html = html.replace('<head>', '<head>' + adShield)
                       .replaceAll('src="/', `src="${targetBase}/`)
                       .replaceAll('href="/', `href="${targetBase}/`)
                       .replaceAll('url(/', `url(${targetBase}/`);

            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(html);
        } else {
            // Forward JS/CSS/Images/Segments directly
            const buffer = await response.arrayBuffer();
            res.setHeader('Content-Type', contentType);
            return res.status(200).send(Buffer.from(buffer));
        }
    } catch (e) {
        return res.status(500).send("Proxy error: " + e.message);
    }
}