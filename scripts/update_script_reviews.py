with open('public/site/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """        frag.appendChild(card);
    });

    track.replaceChildren(frag);
}"""

replacement = """        frag.appendChild(card);
    });

    track.replaceChildren(frag);

    // Apply inline animation with high priority (Left-To-Right continuous slide)
    track.style.setProperty('animation-name', 'marqueeLeftToRight', 'important');
    track.style.setProperty('animation-duration', '36s', 'important');
    track.style.setProperty('animation-timing-function', 'linear', 'important');
    track.style.setProperty('animation-iteration-count', 'infinite', 'important');
    track.style.setProperty('animation-play-state', 'running', 'important');

    // JS-based continuous slider fallback:
    // If computed animationName is 'none' (e.g. OS reduced motion active), JS smoothly moves track left-to-right!
    if (window._satvikRatingsMarqueeRaf) {
        cancelAnimationFrame(window._satvikRatingsMarqueeRaf);
    }

    let isPaused = false;
    track.addEventListener('mouseenter', () => { isPaused = true; });
    track.addEventListener('mouseleave', () => { isPaused = false; });
    track.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
    track.addEventListener('touchend', () => { isPaused = false; }, { passive: true });

    setTimeout(() => {
        const computedStyle = window.getComputedStyle(track);
        if (computedStyle.animationName === 'none' || (computedStyle.animationPlayState === 'paused' && !isPaused)) {
            // CSS animation is suppressed by OS setting. Execute JS continuous slide left-to-right!
            const halfW = track.scrollWidth / 2;
            let pos = -halfW;
            let lastTime = performance.now();
            const speedPxPerSec = 45;

            function step(now) {
                const dt = (now - lastTime) / 1000;
                lastTime = now;
                if (!isPaused && dt > 0 && dt < 0.2) {
                    pos += speedPxPerSec * dt;
                    if (pos >= 0) {
                        pos = -halfW;
                    }
                    track.style.transform = `translate3d(${pos}px, 0, 0)`;
                }
                window._satvikRatingsMarqueeRaf = requestAnimationFrame(step);
            }
            window._satvikRatingsMarqueeRaf = requestAnimationFrame(step);
        }
    }, 150);
}"""

if target in content:
    content = content.replace(target, replacement, 1)
    print("Direct target matched and replaced!")
else:
    # Normalize CRLF
    content_norm = content.replace('\r\n', '\n')
    target_norm = target.replace('\r\n', '\n')
    if target_norm in content_norm:
        content_norm = content_norm.replace(target_norm, replacement.replace('\r\n', '\n'), 1)
        content = content_norm
        print("Normalized target matched and replaced!")
    else:
        print("Target NOT matched!")

with open('public/site/script.js', 'w', encoding='utf-8') as f:
    f.write(content)
