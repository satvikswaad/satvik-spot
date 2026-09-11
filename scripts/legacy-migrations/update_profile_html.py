import re

def update_profile():
    with open('public/site/profile.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract existing forms and sections
    auth_card_match = re.search(r'(<div[^>]*>.*?btn-google-signin.*?btn-google-signout.*?</div>\s*</div>)', content, re.DOTALL)
    form_profile_match = re.search(r'<form id="form-profile-details">.*?</form>', content, re.DOTALL)
    form_address_match = re.search(r'<form id="form-address-details">.*?</form>', content, re.DOTALL)
    orders_list_match = re.search(r'<div id="profile-orders-list">.*?</div>', content, re.DOTALL)
    
    # Wait, the auth card might be tricky to extract cleanly with regex. Let's just hardcode the extracted elements if possible, or build them.
    # Actually, the user says "preserve all existing forms, buttons, and dynamic elements".
    
    # Let's construct the new HTML
    
    hero_html = """
    <!-- HERO BANNER -->
    <section class="relative isolate">
        <div class="relative h-[300px] w-full overflow-hidden md:h-[360px]" style="height: 360px;">
            <img src="assets/village-hero.png" alt="" class="object-cover" style="width: 100%; height: 100%; object-fit: cover;" />
            <div class="absolute inset-0 bg-gradient-to-r from-[oklch(0.35_0.05_120/0.55)] via-[oklch(0.5_0.05_110/0.15)] to-transparent" style="position: absolute; inset: 0; background: linear-gradient(to right, rgba(20,40,20,0.55), rgba(40,50,30,0.15), transparent);"></div>
            
            <div class="absolute right-0 top-0 h-24 w-24" style="position: absolute; right: 0; top: 0; width: 96px; height: 96px;">
                <div class="h-full w-full bg-brand-green-deep" style="width: 100%; height: 100%; background-color: var(--brand-green-deep, #1a3a2a); clip-path: polygon(100% 0, 0 0, 100% 100%);"></div>
                <!-- LeafSpray -->
                <svg viewBox="0 0 120 120" class="pointer-events-none select-none opacity-80" style="position: absolute; right: 8px; top: 8px; width: 40px; height: 40px; transform: scaleX(-1); opacity: 0.8;" aria-hidden="true" fill="none">
                    <path d="M20 108C34 78 46 60 74 40C86 31 98 24 108 18" stroke="var(--brand-green)" stroke-width="2.4" stroke-linecap="round"/>
                    <g transform="translate(34 82) rotate(-35)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                    <g transform="translate(46 66) rotate(-20)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                    <g transform="translate(60 52) rotate(-5)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                    <g transform="translate(74 40) rotate(10)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                    <g transform="translate(88 30) rotate(22)"><path d="M0 0C10 -4 22 -3 30 6C20 10 8 9 0 0Z" fill="var(--brand-green)" opacity="0.9"/><path d="M0 0C-10 -4 -22 -3 -30 6C-20 10 -8 9 0 0Z" fill="var(--brand-green)" opacity="0.72"/></g>
                </svg>
            </div>
            
            <div class="relative z-10 flex h-full max-w-[1500px] mx-auto items-center px-6 md:px-12" style="position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; max-width: 1500px; margin: 0 auto; padding: 0 48px;">
                <div class="animate-fade-up">
                    <h1 class="font-script font-bold drop-shadow-sm" style="line-height: 0.85;">
                        <span class="block text-4xl md:text-6xl" style="display: block; color: white; font-size: 3.75rem;">My</span>
                        <span class="mt-1 inline-flex items-center gap-3 text-5xl md:text-7xl" style="display: inline-flex; align-items: center; gap: 12px; color: var(--brand-gold); font-size: 4.5rem; margin-top: 4px;">
                            <span class="brush-underline">Profile</span>
                            <svg viewBox="0 0 32 30" class="h-8 w-8 text-brand-gold" style="width: 32px; height: 32px; color: var(--brand-gold);" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                        </span>
                    </h1>
                    <p class="mt-4 font-script text-2xl md:text-3xl" style="margin-top: 16px; font-size: 1.875rem; color: #f5f5f5;">
                        <span class="brush-underline">Good Food ♥ Healthy You ♥ Happier Life</span>
                    </p>
                </div>
            </div>
            
            <div class="pointer-events-none absolute bottom-0 right-6 z-10 hidden items-end gap-0 md:flex" style="position: absolute; bottom: 0; right: 24px; z-index: 10; display: flex; align-items: flex-end; gap: 0;">
                <div class="relative h-40 w-40 translate-y-3" style="width: 160px; height: 160px; transform: translateY(12px);">
                    <img src="assets/pickle-bowl.png" alt="" class="object-contain drop-shadow-lg" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 8px rgba(0,0,0,0.04));" />
                </div>
                <div class="relative h-64 w-48 animate-float" style="width: 192px; height: 256px;">
                    <img src="assets/hara-mirch-jar.png" alt="Satvik Swaad Hara Mirch Pickle jar" class="object-contain drop-shadow-xl" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 20px 13px rgba(0,0,0,0.03));" />
                </div>
            </div>
            
            <div class="absolute right-6 top-8 z-20 hidden text-right lg:block" style="position: absolute; right: 24px; top: 32px; z-index: 20; text-align: right; display: block;">
                <span class="block font-script text-2xl leading-tight text-[oklch(0.98_0.02_92)]" style="display: block; font-family: var(--font-handwriting); font-size: 1.5rem; color: white;">Tradition</span>
                <span class="block font-script text-2xl leading-tight text-[oklch(0.98_0.02_92)]" style="display: block; font-family: var(--font-handwriting); font-size: 1.5rem; color: white;">in Every</span>
                <span class="block font-script text-2xl leading-tight text-[oklch(0.98_0.02_92)]" style="display: block; font-family: var(--font-handwriting); font-size: 1.5rem; color: white;">Bite</span>
                <svg viewBox="0 0 32 30" style="margin-left: auto; margin-top: 4px; height: 20px; width: 20px; color: white;" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
            </div>
        </div>
        
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" class="block w-full -mt-8 h-8 md:-mt-12 md:h-12" style="display: block; width: 100%; height: 48px; margin-top: -48px; position: relative; z-index: 20;" aria-hidden="true">
            <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" fill="var(--background)" />
        </svg>
    </section>
    
    <main id="main-content" role="main" style="max-width: 1500px; margin: 0 auto; padding: 20px 16px 60px; display: grid; grid-template-columns: 260px 1fr 300px; gap: 32px;" class="profile-layout">
        
        <!-- LEFT SIDEBAR -->
        <aside style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Avatar Card -->
            <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: var(--shadow-soft); display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid var(--color-border);">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--brand-green-light); color: var(--brand-green-deep); font-size: 2.5rem; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 12px; border: 2px solid var(--brand-green);">
                    <span id="profile-display-initial">👤</span>
                </div>
                <h2 style="margin: 0; font-size: 1.25rem; color: var(--brand-ink); font-family: var(--font-body-new); font-weight: 700;" id="profile-display-name">Guest User</h2>
                <p style="margin: 4px 0 12px; font-size: 0.9rem; color: #6b7280;" id="profile-display-phone">Please sign in</p>
                <div style="background: #e6f4ea; color: #1e8e3e; font-size: 0.75rem; font-weight: 700; padding: 4px 12px; border-radius: 999px; display: inline-flex; align-items: center; gap: 4px;">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                    Google Account
                </div>
            </div>
            
            <!-- Navigation -->
            <nav style="display: flex; flex-direction: column; gap: 8px;">
                <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--brand-green-deep); color: white; border-radius: 999px; font-weight: 600; text-decoration: none;">
                    👤 My Profile
                </a>
                <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--brand-ink); font-weight: 500; text-decoration: none; border-radius: 999px; transition: background 0.2s;">
                    📦 My Orders
                </a>
                <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--brand-ink); font-weight: 500; text-decoration: none; border-radius: 999px; transition: background 0.2s;">
                    📍 My Addresses
                </a>
                <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--brand-ink); font-weight: 500; text-decoration: none; border-radius: 999px; transition: background 0.2s;">
                    ♥ Wishlist
                </a>
                <a href="#" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--brand-ink); font-weight: 500; text-decoration: none; border-radius: 999px; transition: background 0.2s;">
                    ⚙ Settings
                </a>
                
                <div style="margin-top: 16px; border-top: 1px solid var(--color-border); padding-top: 16px;">
                    <div id="btn-google-signin" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--brand-ink); font-weight: 600; cursor: pointer;">
                        ➡ Sign In
                    </div>
                    <div id="btn-google-signout" style="display: none; align-items: center; gap: 12px; padding: 12px 16px; color: #ef4444; font-weight: 600; cursor: pointer;">
                        ➡ Logout
                    </div>
                </div>
            </nav>
            
            <div style="margin-top: auto; padding-top: 32px; text-align: center;">
                <span class="font-script text-handwrite" style="font-size: 1.75rem; line-height: 1.2;">Healthy Choices<br>Happy You ♥</span>
            </div>
        </aside>
        
        <!-- CENTER CONTENT -->
        <div class="profile-section-content" style="display: flex; flex-direction: column; gap: 24px;">
            
            <!-- Card 1: Personal Information -->
            <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: var(--shadow-soft); border: 1px solid var(--color-border);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--brand-ink); font-family: var(--font-body-new);">Personal Information</h2>
                    <button style="background: none; border: none; color: var(--brand-green); font-weight: 600; font-size: 0.9rem; cursor: pointer;">Edit Profile</button>
                </div>
                
                <form id="form-profile-details">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <label for="prof-name" style="display: block; font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 6px;">Full Name</label>
                            <input type="text" id="prof-name" placeholder="Enter your full name" style="width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: #f9fafb;" required />
                        </div>
                        <div>
                            <label for="prof-email" style="display: block; font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 6px;">Email Address</label>
                            <input type="email" id="prof-email" placeholder="name@example.com" style="width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: #f9fafb;" />
                        </div>
                        <div>
                            <label for="prof-phone" style="display: block; font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 6px;">Phone Number</label>
                            <input type="tel" id="prof-phone" placeholder="10-digit mobile number" style="width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: #f9fafb;" required />
                        </div>
                        <div>
                            <label for="prof-joined" style="display: block; font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 6px;">Joined Date</label>
                            <input type="text" id="prof-joined" value="September 2026" style="width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: #f9fafb; color: #9ca3af;" readonly />
                        </div>
                    </div>
                    <button type="submit" style="display: none;">Save</button>
                </form>
            </div>
            
            <!-- Card 2: Saved Addresses -->
            <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: var(--shadow-soft); border: 1px solid var(--color-border);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--brand-ink); font-family: var(--font-body-new);">Saved Addresses</h2>
                    <button style="background: none; border: none; color: var(--brand-green); font-weight: 600; font-size: 0.9rem; cursor: pointer;">+ Add New Address</button>
                </div>
                
                <div id="profile-addresses-list" style="display: flex; flex-direction: column; gap: 16px;">
                    <!-- Embedded address form since JS logic updates it -->
                    <form id="form-address-details" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 600; color: var(--brand-ink);">Home</span>
                                <span style="background: var(--brand-green-light); color: var(--brand-green-deep); font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">Default</span>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <button type="button" style="background: none; border: none; color: var(--brand-green); font-size: 0.85rem; font-weight: 600; cursor: pointer;">Edit</button>
                                <button type="button" style="background: none; border: none; color: #ef4444; font-size: 0.85rem; font-weight: 600; cursor: pointer;">Delete</button>
                            </div>
                        </div>
                        
                        <div style="display: grid; gap: 12px; margin-bottom: 12px;">
                            <input type="text" id="prof-house" placeholder="House/Flat No." style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.9rem; background: #f9fafb;" />
                            <input type="text" id="prof-street" placeholder="Street/Area" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.9rem; background: #f9fafb;" />
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <input type="text" id="prof-city" placeholder="City" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.9rem; background: #f9fafb;" />
                                <input type="text" id="prof-pincode" placeholder="Pincode" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.9rem; background: #f9fafb;" />
                            </div>
                        </div>
                        <button type="submit" style="display: none;">Save Address</button>
                    </form>
                </div>
            </div>
            
            <!-- Card 3: Order History -->
            <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: var(--shadow-soft); border: 1px solid var(--color-border);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--brand-ink); font-family: var(--font-body-new);">Order History</h2>
                    <a href="#" style="color: var(--brand-green); font-weight: 600; font-size: 0.9rem; text-decoration: none;">View All Orders →</a>
                </div>
                
                <div id="profile-orders-list">
                    <p style="text-align: center; color: var(--color-sub); padding: 20px 0;">No past orders recorded on this device yet. Browse our homemade catalogue and place your first order!</p>
                </div>
            </div>
            
        </div>
        
        <!-- RIGHT COLUMN -->
        <aside style="display: flex; flex-direction: column; align-items: center; gap: 32px; padding-top: 24px;">
            <!-- Polaroid -->
            <figure class="relative w-fit bg-[oklch(0.98_0.01_92)] p-3 pb-5 shadow-[0_14px_36px_-14px_rgba(60,50,20,0.5)]" style="transform: rotate(-3deg); background: #faf8f2; padding: 12px 12px 20px; box-shadow: 0 14px 36px -14px rgba(60,50,20,0.5); position: relative; width: fit-content;">
                <span class="tape" style="position: absolute; width: 74px; height: 26px; background: rgba(200,185,140,0.6); top: -12px; left: 50%; transform: translateX(-50%) rotate(-3deg); box-shadow: 0 1px 3px rgba(0,0,0,0.12);" aria-hidden="true"></span>
                <div class="relative aspect-[4/5] w-56 overflow-hidden md:w-64" style="aspect-ratio: 4/5; width: 256px; position: relative; overflow: hidden;">
                    <img src="assets/mother-child.png" alt="" class="object-cover" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <figcaption class="mt-3 flex items-center justify-center gap-1 text-center font-script text-2xl leading-tight text-handwrite" style="margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 4px; text-align: center; font-family: var(--font-handwriting); font-size: 1.5rem; color: var(--brand-ink);">
                    <span class="brush-underline">Maa ke swaad ki virasat</span>
                    <svg viewBox="0 0 32 30" class="h-4 w-4 text-brand-gold-deep" style="width: 16px; height: 16px; color: #b8860b;" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>
                </figcaption>
            </figure>
            
            <div style="text-align: center;">
                <span class="font-script text-handwrite" style="font-size: 2rem; line-height: 1.2;">Good Food<br>Good Mood ♥</span>
            </div>
            
            <div style="text-align: center;">
                <span class="font-script text-handwrite" style="font-size: 1.75rem; color: var(--brand-green);">Same Love Since Generations ♥</span>
            </div>
        </aside>
        
    </main>
    
    <!-- GREEN WAVE TRUST BAR -->
    <div style="position: relative; width: 100%;">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display: block; width: 100%; height: 48px; background: transparent; transform: translateY(2px);" aria-hidden="true">
            <path d="M0 30C120 8 260 6 420 22C620 42 760 54 920 40C1080 26 1240 6 1440 24V60H0V30Z" fill="var(--brand-green-deep)" />
        </svg>
        <div style="background: var(--brand-green-deep); color: white; padding: 24px 0 40px; display: flex; justify-content: space-around; flex-wrap: wrap; gap: 24px;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🌿</div>
                <span style="font-weight: 600; font-size: 0.95rem;">100% Pure & Natural</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🏺</div>
                <span style="font-weight: 600; font-size: 0.95rem;">Traditional Recipes</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">🚚</div>
                <span style="font-weight: 600; font-size: 0.95rem;">Fast Secure Delivery</span>
            </div>
        </div>
    </div>
"""
    
    # Let's use regex to replace from <!-- BREADCRUMBS --> down to </main>
    # Also I should inject it properly.
    pattern = r'<!-- BREADCRUMBS -->.*?</main>'
    new_content = re.sub(pattern, hero_html, content, flags=re.DOTALL)
    
    with open('public/site/profile.html', 'w', encoding='utf-8') as f:
        f.write(new_content)

update_profile()
