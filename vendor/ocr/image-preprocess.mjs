function imageVariant(src,kind){const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(src,0,0);if(kind==='raw')return c;let p=x.getImageData(0,0,c.width,c.height),d=p.data;if(kind==='gray'){let hist=new Uint32Array(256),sum=0,total=c.width*c.height;for(let i=0;i<d.length;i+=4){const v=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2]);hist[v]++;sum+=v}let wb=0,sb=0,best=0,thr=127;for(let n=0;n<256;n++){wb+=hist[n];if(!wb)continue;let wf=total-wb;if(!wf)break;sb+=n*hist[n];let score=wb*wf*(sb/wb-(sum-sb)/wf)**2;if(score>best){best=score;thr=n}}for(let i=0;i<d.length;i+=4){const v=.299*d[i]+.587*d[i+1]+.114*d[i+2];let b=v>thr?255:0;if(sum/total<128)b=255-b;d[i]=d[i+1]=d[i+2]=b}}else{const bg=document.createElement('canvas');bg.width=c.width;bg.height=c.height;const b=bg.getContext('2d',{willReadFrequently:true});b.filter=`blur(${Math.max(8,Math.round(Math.min(c.width,c.height)*.36))}px)`;b.drawImage(c,0,0);const z=b.getImageData(0,0,c.width,c.height).data;for(let i=0;i<d.length;i+=4)if(.299*z[i]+.587*z[i+1]+.114*z[i+2]<125){d[i]=255-d[i];d[i+1]=255-d[i+1];d[i+2]=255-d[i+2]}bg.width=bg.height=0}x.putImageData(p,0,0);return c}
        function otsuThreshold(hist, total) {
            let sum = 0;
            for (let i = 0; i < 256; i++) sum += i * hist[i];
            let sumB = 0, wB = 0, best = 0, threshold = 127;
            for (let t = 0; t < 256; t++) {
                wB += hist[t];
                if (wB === 0) continue;
                const wF = total - wB;
                if (wF === 0) break;
                sumB += t * hist[t];
                const mB = sumB / wB, mF = (sum - sumB) / wF;
                const between = wB * wF * (mB - mF) * (mB - mF);
                if (between > best) { best = between; threshold = t; }
            }
            return threshold;
        }

        async function preprocessV6(file) {
            const img = file;
            // Phóng to ảnh nhỏ để chữ đủ nét (Tesseract cần chữ cao khoảng 30px trở lên)
            const scale = Math.min(3, Math.max(1, 1800 / Math.min(img.width, img.height)));
            const boundedScale = Math.min(scale, Math.sqrt(20000000 / (img.width * img.height)));
            const w = Math.max(1, Math.round(img.width * boundedScale)), h = Math.max(1, Math.round(img.height * boundedScale));

            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);

            const px = ctx.getImageData(0, 0, w, h);
            const d = px.data;
            const gray = new Uint8ClampedArray(w * h);
            const hist = new Array(256).fill(0);
            let mean = 0;
            for (let i = 0, j = 0; i < d.length; i += 4, j++) {
                const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
                gray[j] = g; hist[g]++; mean += g;
            }
            mean /= (w * h);

            // Tương phản: kéo giãn dải 1%–99% độ sáng
            let lo = 0, hi = 255, acc = 0;
            const total = w * h;
            for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc > total * 0.01) { lo = i; break; } }
            acc = 0;
            for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc > total * 0.01) { hi = i; break; } }
            const range = Math.max(1, hi - lo);

            // Nhị phân hóa (Otsu). Nếu nền tối, đảo để chữ đen trên nền trắng.
            const thr = otsuThreshold(hist, total);
            const invert = mean < 128;
            for (let j = 0; j < total; j++) {
                let v = Math.min(255, Math.max(0, ((gray[j] - lo) * 255) / range));
                let bin = v > thr ? 255 : 0;
                if (invert) bin = 255 - bin;
                const k = j * 4;
                d[k] = d[k + 1] = d[k + 2] = bin;
                d[k + 3] = 255;
            }
            ctx.putImageData(px, 0, 0);
            return canvas;
        }


function overlap(a,b){const x=Math.max(0,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0)),y=Math.max(0,Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)),i=x*y;return i/Math.max(1,Math.min((a.x1-a.x0)*(a.y1-a.y0),(b.x1-b.x0)*(b.y1-b.y0)))}
function mergeImage(outputs){const chosen=[];for(const d of outputs)for(const w of d.words||[]){const text=(w.text||'').trim(),b=w.bbox;if(!b||!text||!/[\p{L}\p{N}]/u.test(text))continue;const agreed=w.confidence>=10&&text.length>=3&&outputs.some(other=>other!==d&&(other.words||[]).some(v=>(v.text||'').trim().toLocaleLowerCase()===text.toLocaleLowerCase()&&v.bbox&&overlap(v.bbox,b)>.6));if(w.confidence<45&&!agreed)continue;const entry={text,bbox:b,confidence:w.confidence};const match=chosen.findIndex(v=>overlap(v.bbox,b)>.6);if(match<0)chosen.push(entry);else if(entry.confidence>chosen[match].confidence)chosen[match]=entry}chosen.sort((a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0);const lines=[];for(const w of chosen){const mid=(w.bbox.y0+w.bbox.y1)/2;let line=lines.find(l=>Math.abs(mid-l.mid)<Math.max(4,Math.min(l.height,w.bbox.y1-w.bbox.y0)*.55));if(!line){line={mid,height:w.bbox.y1-w.bbox.y0,items:[]};lines.push(line)}line.items.push(w)}lines.sort((a,b)=>a.mid-b.mid);for(const line of lines)line.items.sort((a,b)=>a.bbox.x0-b.bbox.x0);return {text:lines.map(l=>l.items.map(w=>w.text).join(' ')).join('\n'),words:lines.flatMap(l=>l.items)}}

export {imageVariant, preprocessV6, mergeImage};
