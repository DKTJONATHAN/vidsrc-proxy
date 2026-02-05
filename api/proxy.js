export default async function handler(req, res) {
    const targetBase = "https://vidsrc.xyz";
    
    // Ensure we don't double up on slashes
    const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
    const targetUrl = `${targetBase}${path}`;

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
            
            const adShield = `
            <script>
                (function() {
                    window.open = function() { return null; };
                    const clean = () => {
                        document.querySelectorAll('script[src*="ads"], script[src*="pop"], iframe[src*="ads"], .ad-banner').forEach(el => el.remove());
                    };
                    setInterval(clean, 500);
                })();
            </script>`;

            html = html.replace('<head>', '<head>' + adShield)
                       .replaceAll('src="/', `src="${targetBase}/`)
                       .replaceAll('href="/', `href="${targetBase}/`)
                       .replaceAll('url(/', `url(${targetBase}/`);

            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(html);
        } else {
            const arrayBuffer = await response.arrayBuffer();
            res.setHeader('Content-Type', contentType);
            return res.status(200).send(Buffer.from(arrayBuffer));
        }
    } catch (e) {
        console.error(e);
        return res.status(500).send("Proxy error: " + e.message);
    }
}