document.addEventListener('DOMContentLoaded', () => {
    const homePage = document.getElementById('home');
    const wheelPage = document.getElementById('wheel-page');
    
    // Gestisci il click sul pulsante di start
    document.querySelector('.start-button').addEventListener('click', () => {
        // Nascondi la home
        homePage.classList.remove('active');
        
        // Mostra la pagina della ruota
        setTimeout(() => {
            wheelPage.classList.add('active');
            
            // Inizializza la ruota dopo che la pagina è visibile
            setTimeout(() => {
                if (!window.wheelInstance) {
                    window.wheelInstance = new WheelOfNames();
                }
            }, 100);
        }, 300);
    });
});

class WheelOfNames {
    constructor() {
        this.wheel = document.getElementById('wheel');
        this.startBtn = document.getElementById('startBtn');
        this.namesList = document.getElementById('namesList');
        this.defaultNames = [
            'Beyram Taglietti', 'Cristina Borboni', 'Daniele Ghidoni', 'Davide Bonomelli',
            'Eric Lorini', 'Ezio Vergine', 'Fabrizio Favalli', 'Federica Ghiglia',
            'Federico Mitelli', 'Papa Bergoglio', 'Flavio Cola', 'Giacomo Papotti', 'Luissssssa (EL)',
            'Baggio Roberto', 'Luca Ferrari', 'Luca Giannoni',
            'Marco Canedoli', 'Matteo Treccani', 'Vècio Camunda (NM)', 'Matteo Piccu',
            'Monica Pietroboni', 'Nicola Migliorati', 'Pietro Naoni', 'Saul Aquino',
            'Mauro Piccini', 'Elena Leoni', 'Mauro Manicardi'
        ];
        this.remainingNames = [...this.defaultNames];
        
        // Genera i colori una volta sola e mantienili in un oggetto con i nomi come chiavi
        this.colorMap = {};
        const colors = this.generateColors(this.defaultNames.length);
        this.defaultNames.forEach((name, index) => {
            this.colorMap[name] = colors[index];
        });
        
        this.initializeUI();
        this.initializeEvents();
        this.isSpinning = false;
        
        this.createEndMessage();
        
        // Inizializza il suono
        this.winSound = new Audio('fanfare-1-276819.mp3');
        this.winSound.volume = 1;
        // Precarica il suono
        this.winSound.load();
        
        this.tickSound = new Audio('tick.mp3');  // Breve suono di tick
        this.tickSound.volume = 0.3;  // Volume più basso per il tick
        this.lastTick = 0;  // Per tracciare l'ultimo tick
        this.tickThreshold = 360 / this.remainingNames.length;  // Gradi tra un tick e l'altro
        
        // Inizializza il suono del tick usando AudioContext
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.tickBuffer = this.createTickSound();
    }

    generateColors(num) {
        const colors = new Set();
        const baseHues = [
            0,    // rosso
            15,   // rosso-arancio
            30,   // arancione
            45,   // arancione-giallo
            60,   // giallo
            75,   // giallo-lime
            90,   // lime
            120,  // verde
            150,  // verde acqua
            165,  // acqua
            180,  // ciano
            195,  // ciano-azzurro
            210,  // azzurro
            225,  // azzurro-blu
            240,  // blu
            260,  // blu-viola
            280,  // viola
            300,  // magenta
            320,  // rosa
            340   // rosa-rosso
        ];
        
        // Distribuisci i colori uniformemente
        for (let i = 0; i < num; i++) {
            const baseHue = baseHues[i % baseHues.length];
            const hue = baseHue + (Math.random() * 10 - 5); // Piccola variazione
            colors.add(`hsl(${hue}, 80%, 60%)`);
        }
        
        return Array.from(colors);
    }

    initializeUI() {
        this.createNamesList();
        this.createWinnerDisplay();
        this.createWheel();
    }

    createNamesList() {
        this.defaultNames.forEach(name => {
            const nameItem = document.createElement('div');
            nameItem.className = 'name-item active';
            nameItem.textContent = name;
            this.namesList.appendChild(nameItem);
        });
    }

    createWinnerDisplay() {
        const winnerDisplay = document.createElement('div');
        winnerDisplay.className = 'winner-display';
        winnerDisplay.innerHTML = `
            <h1 class="winner-name"></h1>
        `;
        document.body.appendChild(winnerDisplay);
        this.winnerDisplay = winnerDisplay;
    }

    initializeEvents() {
        this.startBtn.addEventListener('click', () => {
            if (!this.isSpinning) this.spin();
        });
        
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter' && !this.isSpinning) {
                event.preventDefault(); // Previene lo scroll della pagina
                this.spin();
            }
        });
    }

    createWheel() {
        this.wheel.innerHTML = '';
        const anglePerSector = 360 / this.remainingNames.length;
        
        this.remainingNames.forEach((name, index) => {
            // Crea il settore come prima
            const sector = document.createElement('div');
            sector.className = 'sector';
            sector.style.backgroundColor = this.colorMap[name];
            
            const startAngle = index * anglePerSector;
            const endAngle = (index + 1) * anglePerSector;
            const clipPath = this.createSectorClipPath(startAngle, endAngle);
            sector.style.clipPath = clipPath;
            
            // Aggiungi il pallino all'inizio del settore
            const dot = document.createElement('div');
            dot.className = 'sector-dot';
            dot.style.transform = `rotate(${startAngle}deg) translateX(-50%) translateY(-50vh)`;
            
            // Aggiungi il contenuto del settore come prima
            const content = document.createElement('div');
            content.className = 'sector-content';
            content.textContent = name;
            
            const midAngle = startAngle + (anglePerSector / 2);
            content.style.transform = `
                translate(-50%, -50%)
                rotate(${midAngle}deg)
                translate(0, -250px)
                rotate(-90deg)
            `;
            
            sector.appendChild(content);
            this.wheel.appendChild(sector);
            this.wheel.appendChild(dot);
        });
        
        if (!this.wheel.parentElement.querySelector('.pointer')) {
            const pointer = document.createElement('div');
            pointer.className = 'pointer';
            this.wheel.parentElement.appendChild(pointer);
        }

        // Aggiorna il testo del pulsante
        this.startBtn.innerHTML = '🎲 Gira la Ruota! 🎲';
    }

    createSectorClipPath(startAngle, endAngle) {
        const center = { x: 50, y: 50 };
        const radius = 50;
        const points = [];
        
        // Punto centrale
        points.push(`${center.x}% ${center.y}%`);
        
        // Crea l'arco con più punti per una migliore precisione
        const numPoints = 30; // Aumentato il numero di punti per un arco più preciso
        for (let i = 0; i <= numPoints; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / numPoints);
            const angleRad = (angle - 90) * Math.PI / 180;
            const x = center.x + radius * Math.cos(angleRad);
            const y = center.y + radius * Math.sin(angleRad);
            points.push(`${x}% ${y}%`);
        }
        
        return `polygon(${points.join(', ')})`;
    }

    showWinner(winner, color) {
        // Riproduci il suono
        this.playWinSound();
        
        this.createOverlay();
        this.overlay.classList.add('show');
        
        this.winnerDisplay.querySelector('.winner-name').textContent = winner;
        this.winnerDisplay.style.background = `linear-gradient(45deg, ${this.colorMap[winner]}, rgba(0,0,0,0.9))`;
        this.winnerDisplay.classList.add('show');
        
        // Posizioni dei fuochi d'artificio agli angoli della pagina
        const positions = [
            { x: 0, y: 0 },                               // Alto-sinistra
            { x: window.innerWidth, y: 0 },               // Alto-destra
            { x: 0, y: window.innerHeight },              // Basso-sinistra
            { x: window.innerWidth, y: window.innerHeight }  // Basso-destra
        ];
        
        const createFireworks = () => {
            positions.forEach(pos => {
                this.createFirework(pos.x, pos.y);
            });
        };
        
        const interval = setInterval(createFireworks, 300);
        
        setTimeout(() => {
            clearInterval(interval);
            this.winnerDisplay.classList.remove('show');
            this.overlay.classList.remove('show');
        }, 3000);
    }

    playWinSound() {
        try {
            // Resetta e riproduci il suono
            const playPromise = this.winSound.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Riproduzione avviata con successo
                        this.winSound.currentTime = 0;
                    })
                    .catch(error => {
                        console.log('Errore nella riproduzione del suono:', error);
                        // Riprova a caricare il suono
                        this.winSound.load();
                    });
            }
        } catch (e) {
            console.log('Errore nella riproduzione del suono:', e);
        }
    }

    markNameAsExtracted(name) {
        const nameItems = this.namesList.querySelectorAll('.name-item');
        nameItems.forEach(item => {
            if (item.textContent === name) {
                item.classList.remove('active');
                item.classList.add('extracted');
            }
        });
    }

    spin() {
        if (this.isSpinning || this.remainingNames.length === 0) {
            if (this.remainingNames.length === 0) {
                this.createOverlay();
                this.overlay.classList.add('show');
                this.endMessage.classList.add('show');
                
                setTimeout(() => {
                    this.endMessage.classList.remove('show');
                    this.overlay.classList.remove('show');
                }, 3000);
            }
            return;
        }

        // Prova a riprodurre un suono silenzioso per sbloccare l'audio
        const unlockAudio = () => {
            const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
            silentSound.play().catch(() => {});
        };
        
        unlockAudio();
        this.isSpinning = true;
        this.startBtn.disabled = true;
        
        // Reset della rotazione prima di iniziare
        this.wheel.style.transition = 'none';
        this.wheel.style.transform = 'rotate(0deg)';
        this.wheel.offsetHeight; // Forza il reflow
        this.wheel.style.transition = 'transform 6s cubic-bezier(0.16, 1, 0.3, 1)';
        
        const randomRotations = 5 + Math.random() * 5;
        const randomAngle = Math.random() * 360;
        const totalDegrees = (randomRotations * 360) + randomAngle;
        
        let lastRotation = 0;
        const animate = () => {
            const currentRotation = this.getRotation(this.wheel);
            
            // Calcola se è il momento di riprodurre un tick
            if (Math.abs(currentRotation - this.lastTick) >= this.tickThreshold) {
                this.playTickSound();
                this.lastTick = currentRotation;
            }
            
            if (this.isSpinning) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(() => {
            this.wheel.style.transform = `rotate(${totalDegrees}deg)`;
            animate();
        });
        
        setTimeout(() => {
            const winningIndex = Math.floor(this.remainingNames.length - 
                (totalDegrees % 360) / (360 / this.remainingNames.length)) % 
                this.remainingNames.length;
            
            const winner = this.remainingNames[winningIndex];
            this.showWinner(winner, this.colorMap[winner]);
            this.markNameAsExtracted(winner);
            
            this.remainingNames = this.remainingNames.filter(name => name !== winner);
            
            setTimeout(() => {
                this.wheel.style.transition = 'none';
                this.wheel.style.transform = 'rotate(0deg)';
                this.wheel.offsetHeight;
                this.wheel.style.transition = 'transform 6s cubic-bezier(0.16, 1, 0.3, 1)';
                this.createWheel();
                this.isSpinning = false;
                this.startBtn.disabled = false;
            }, 3500);
        }, 6000);
    }

    createFirework(x, y) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = x + 'px';
        firework.style.top = y + 'px';
        
        const numParticles = 150;  // Ridotto da 250 a 150 particelle
        
        // Calcola il centro dello schermo per la direzione delle particelle
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework-particle';
            
            // Dimensione casuale per ogni particella
            const size = 8 + Math.random() * 4;  // Dimensione tra 8px e 12px
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Colori più vivaci
            const hue = (i * 360 / numParticles) + Math.random() * 30;
            const saturation = 90 + Math.random() * 10;
            const lightness = 45 + Math.random() * 25;
            particle.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            // Calcola l'angolo verso il centro con una variazione più controllata
            const angleToCenter = Math.atan2(centerY - y, centerX - x);
            const angleVariation = (Math.random() - 0.5) * Math.PI / 2.5;
            const angle = angleToCenter + angleVariation;
            
            // Velocità variabile basata sulla distanza dal centro
            const distanceToCenter = Math.sqrt(
                Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2)
            );
            const baseVelocity = distanceToCenter * 0.85;
            const variance = Math.random() * 0.3 + 0.85;
            const velocity = baseVelocity * variance;
            
            particle.style.setProperty('--tx', `${Math.cos(angle) * velocity}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * velocity}px`);
            
            firework.appendChild(particle);
        }
        
        document.body.appendChild(firework);
        setTimeout(() => firework.remove(), 1500);
    }

    createOverlay() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'overlay';
            document.body.appendChild(this.overlay);
        }
    }

    createEndMessage() {
        const endMessage = document.createElement('div');
        endMessage.className = 'end-message';
        const img = document.createElement('img');
        img.src = 'Cu288Sy.gif';
        endMessage.appendChild(img);
        document.body.appendChild(endMessage);
        this.endMessage = endMessage;
    }

    playTickSound() {
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.tickBuffer;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.05;  // Ridotto il volume per compensare la frequenza più alta
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
        } catch (e) {
            console.log('Errore nella riproduzione del tick:', e);
        }
    }

    createTickSound() {
        const duration = 0.02;  // Ridotto a 20ms per un suono più breve
        const sampleRate = this.audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Genera un breve beep
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 2500 * t) *  // Aumentata frequenza a 2500Hz
                      Math.exp(-50 * t);  // Decay più rapido
        }
        
        return buffer;
    }

    getRotation(element) {
        const style = window.getComputedStyle(element);
        const matrix = new WebKitCSSMatrix(style.transform);
        const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        return (angle < 0 ? angle + 360 : angle) % 360;
    }
} 