export default async function handler(req, res) {
    const targetBase = "https://vidsrc.xyz";
    const targetUrl = targetBase + req.url;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'Referer': targetBase,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType && contentType.includes('text/html')) {
            let html = await response.text();
            
            // The "Ad-Killer" Shield
            const adShield = `
            <script>
                (function() {
                    window.open = function() { return null; };
                    const clean = () => {
                        document.querySelectorAll('script[src*="ads"], script[src*="pop"], iframe[src*="ads"]').forEach(el => el.remove());
                    };
                    setInterval(clean, 500);
                })();
            </script>`;

            // Fix relative paths to absolute ones
            html = html.replace('<head>', '<head>' + adShield)
                       .split('src="/').join(`src="${targetBase}/`)
                       .split('href="/').join(`href="${targetBase}/`)
                       .split('url(/').join(`url(${targetBase}/`);

            return res.status(200).send(html);
        } else {
            // For JS/CSS/Videos, pipe the data directly
            const blob = await response.arrayBuffer();
            return res.status(200).send(Buffer.from(blob));
        }
    } catch (e) {
        return res.status(500).send("Proxy error: " + e.message);
    }
}