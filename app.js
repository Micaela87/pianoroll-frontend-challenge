import PianoRoll from './pianoroll.js';
import PianoRollEventsService from './service.js';

class PianoRollDisplay {

  eventsService = null;

  constructor(csvURL) {
    this.csvURL = csvURL;
    this.data = null;
    this.eventsService = new PianoRollEventsService();
    const logo = document.getElementById('logo-container');
    logo.addEventListener('click', this.eventsService.goToHomePage);
  }

  async loadPianoRollData() {
    try {
      const response = await fetch('https://pianoroll.ai/random_notes');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      this.data = await response.json();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  preparePianoRollCard(rollId) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('piano-roll-card');
    cardDiv.setAttribute('id', rollId);
    cardDiv.addEventListener('click', this.eventsService.selectPianoRoll);

    // Create and append other elements to the card container as needed
    const descriptionDiv = document.createElement('div');
    descriptionDiv.classList.add('description');
    descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
    cardDiv.appendChild(descriptionDiv);

    const svgContainer = document.createElement('div');
    svgContainer.classList.add('svg-container');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('piano-roll-svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '150');

    // Append the SVG to the card container
    cardDiv.appendChild(svgContainer);
    svgContainer.appendChild(svg);
    this.eventsService.divCollection.push(cardDiv);

    return { cardDiv, svg }
  }

  async generateSVGs() {
    if (!this.data) await this.loadPianoRollData();
    if (!this.data) return;
    
    const pianoRollContainer = document.getElementById('pianoRollContainer');
    pianoRollContainer.classList.remove('main-piano-roll-view');
    pianoRollContainer.classList.add('grid-view');
    pianoRollContainer.innerHTML = '';
    for (let it = 0; it < 20; it++) {
      const start = it * 60;
      const end = start + 60;
      const partData = this.data.slice(start, end);

      const { cardDiv, svg } = this.preparePianoRollCard(it)

      pianoRollContainer.appendChild(cardDiv);
      const roll = new PianoRoll(svg, partData);
    }
  }
}

document.getElementById('loadCSV').addEventListener('click', async () => {
  const csvToSVG = new PianoRollDisplay();
  await csvToSVG.generateSVGs();
});
