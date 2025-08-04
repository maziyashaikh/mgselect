    class AVIFFrameAnimationHero {
            constructor() {
                this.canvas = document.getElementById('heroCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.frames = [];
                this.currentFrame = 0;
                this.totalFrames = 401;
                this.isLoaded = false;
                this.loadedFrames = 0;
                this.batchSize = 20;
                this.preloadDistance = 50;
                
                this.frameBasePath = './frames/';
                this.frameFilePrefix = 'frame_';
                this.frameFileExtension = '.avif';
                this.framePadding = 4;
                
                this.textChangePoints = [0.25, 0.6];
                this.textStates = [
                    {
                        title: "MG Cyberster",
                        subtitle: "Because turning heads is just the beginning.",
                        cta: "DOWNLOAD BROCHURE"
                    },
                    {
                        title: "Not Designed For Subtlety",
                        subtitle: "Convertible Roof. Electric Scissor Doors.",
                        cta: "DOWNLOAD BROCHURE"
                    },
                    {
                        title: "Electric Excellence",
                        subtitle: "The future of driving is here.",
                        cta: "EXPLORE MORE"
                    }
                ];

                this.init();
            }

            init() {
                this.setupCanvas();
                this.startImagePreloading();
                this.bindEvents();
            }

            setupCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }

            getFrameFileName(index) {
                const paddedIndex = String(index + 1).padStart(this.framePadding, '0');
                return `${this.frameBasePath}${this.frameFilePrefix}${paddedIndex}${this.frameFileExtension}`;
            }

            async startImagePreloading() {
                document.getElementById('loadingPlaceholder').style.display = 'none';
                
                await this.loadFrameBatch(0, Math.min(this.batchSize, this.totalFrames));
                
                for (let i = this.batchSize; i < this.totalFrames; i += this.batchSize) {
                    const endIndex = Math.min(i + this.batchSize, this.totalFrames);
                    await this.loadFrameBatch(i, endIndex);
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                
                this.onAllFramesLoaded();
            }

            async loadFrameBatch(startIndex, endIndex) {
                const promises = [];
                for (let i = startIndex; i < endIndex; i++) {
                    promises.push(this.loadSingleFrame(i));
                }
                await Promise.all(promises);
            }

            loadSingleFrame(index) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const fileName = this.getFrameFileName(index);
                    
                    img.onload = () => {
                        this.frames[index] = img;
                        this.loadedFrames++;
                        resolve(img);
                    };
                    
                    img.onerror = () => {
                        console.warn(`Failed to load frame: ${fileName}`);
                        this.frames[index] = this.frames[Math.max(0, index - 1)] || null;
                        this.loadedFrames++;
                        resolve(null);
                    };
                    
                    img.src = fileName;
                });
            }

            onAllFramesLoaded() {
                this.isLoaded = true;
                this.simulatePreloader();
            }

            simulatePreloader() {
                setTimeout(() => {
                    const preloader = document.getElementById('preloader');
                    const logo = document.getElementById('preloaderLogo');
                    const header = document.getElementById('header');
                    
                    logo.classList.add('shrink');
                    
                    setTimeout(() => {
                        header.classList.add('seamless-transition');
                    }, 1700);
                    
                    setTimeout(() => {
                        preloader.classList.add('fade-out');
                        
                        setTimeout(() => {
                            header.classList.remove('seamless-transition');
                            header.classList.add('visible');
                        }, 200);
                        
                        setTimeout(() => {
                            this.startHeroAnimation();
                        }, 500);
                        
                        setTimeout(() => {
                            preloader.remove();
                        }, 1000);
                    }, 2000);
                }, 1500);
            }

            startHeroAnimation() {
                document.getElementById('heroContent').classList.add('visible');
                document.getElementById('scrollIndicator').classList.add('visible');
                this.drawFrame(0);
            }

            drawFrame(frameIndex) {
                if (!this.isLoaded || !this.frames[frameIndex]) return;
                
                const img = this.frames[frameIndex];
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                const canvasAspect = this.canvas.width / this.canvas.height;
                const imgAspect = img.width / img.height;
                
                let drawWidth = this.canvas.width;
                let drawHeight = this.canvas.height;
                let offsetX = 0;
                let offsetY = 0;
                
                if (imgAspect > canvasAspect) {
                    drawHeight = this.canvas.height;
                    drawWidth = drawHeight * imgAspect;
                    offsetX = (this.canvas.width - drawWidth) / 2;
                } else {
                    drawWidth = this.canvas.width;
                    drawHeight = drawWidth / imgAspect;
                    offsetY = (this.canvas.height - drawHeight) / 2;
                }
                
                this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                this.currentFrame = frameIndex;
                
                const frameCounter = document.getElementById('currentFrameNumber');
                if (frameCounter) {
                    frameCounter.textContent = frameIndex + 1;
                }
            }

            updateTextContent(progress) {
                const heroTitle = document.getElementById('heroTitle');
                const heroSubtitle = document.getElementById('heroSubtitle');
                const heroCta = document.getElementById('heroCta');
                
                let textStateIndex = 0;
                
                if (progress >= this.textChangePoints[1]) {
                    textStateIndex = 2;
                } else if (progress >= this.textChangePoints[0]) {
                    textStateIndex = 1;
                }
                
                const currentState = this.textStates[textStateIndex];
                
                if (heroTitle.textContent !== currentState.title) {
                    heroTitle.style.opacity = '0';
                    heroSubtitle.style.opacity = '0';
                    heroCta.style.opacity = '0';
                    
                    setTimeout(() => {
                        heroTitle.textContent = currentState.title;
                        heroSubtitle.textContent = currentState.subtitle;
                        heroCta.textContent = currentState.cta;
                        
                        heroTitle.style.opacity = '1';
                        heroSubtitle.style.opacity = '0.8';
                        heroCta.style.opacity = '1';
                    }, 200);
                }
            }

            preloadNearbyFrames(currentIndex) {
                const start = Math.max(0, currentIndex - this.preloadDistance);
                const end = Math.min(this.totalFrames - 1, currentIndex + this.preloadDistance);
                
                for (let i = start; i <= end; i++) {
                    if (!this.frames[i]) {
                        this.loadSingleFrame(i);
                    }
                }
            }

            bindEvents() {
                let ticking = false;

                const updateAnimation = () => {
                    const heroSection = document.getElementById('heroSection');
                    const rect = heroSection.getBoundingClientRect();
                    const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
                    
                    const frameIndex = Math.floor(progress * (this.totalFrames - 1));
                    this.drawFrame(frameIndex);
                    this.preloadNearbyFrames(frameIndex);
                    this.updateTextContent(progress);
                    
                    const scrollLine = document.getElementById('scrollLine');
                    if (scrollLine) {
                        scrollLine.style.setProperty('--progress', `${progress * 100}%`);
                    }
                    
                    this.updateSecondSection();
                    ticking = false;
                };

                const onScroll = () => {
                    if (!ticking && this.isLoaded) {
                        requestAnimationFrame(updateAnimation);
                        ticking = true;
                    }
                };

                window.addEventListener('scroll', onScroll);
                window.addEventListener('resize', () => {
                    this.setupCanvas();
                    if (this.isLoaded) {
                        this.drawFrame(this.currentFrame);
                    }
                });
            }
            updateSecondSection() {
                const secondSection = document.getElementById('secondSection');
                const carBackground = document.getElementById('carBackground');
                const carImage = document.getElementById('carImage');
                const sectionContent = document.getElementById('sectionContent');
                if (!secondSection || !carBackground || !carImage) return;
                
                const rect = secondSection.getBoundingClientRect();
                const progress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)));
                const backgroundY = progress * 100;
                carBackground.style.backgroundPosition = `center ${backgroundY}%`;
                if (progress <= 0.3) {
                    carImage.style.opacity = '1';
                    sectionContent.classList.remove('visible');
                } else if (progress <= 0.6) {
                    const fadeProgress = (progress - 0.3) / 0.3;
                    carImage.style.opacity = `${1 - fadeProgress}`;
                    sectionContent.classList.remove('visible');
                } else {
                    carImage.style.opacity = '0';
                    sectionContent.classList.add('visible');
                }
            }
        }
        document.addEventListener('DOMContentLoaded', () => {
            new AVIFFrameAnimationHero();
        });