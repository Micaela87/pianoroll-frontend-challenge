import PianoRoll from './pianoroll.js';

let csvToSVG = null;

class PianoRollDisplay {

  divCollection = [];
  selected = null;
  selection = null;
  start = null;
  svgContainerX = null;

  constructor(csvURL) {
    this.csvURL = csvURL;
    this.data = null;
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
    cardDiv.addEventListener('click', this.selectPianoRoll);

    

    // Create and append other elements to the card container as needed
    const descriptionDiv = document.createElement('div');
    descriptionDiv.classList.add('description');
    descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
    cardDiv.appendChild(descriptionDiv);

    const svgContainer = document.createElement('div');
    svgContainer.setAttribute('draggable', 'true');
    svgContainer.style.position = 'relative';
    svgContainer.style.width = '80%';
    svgContainer.style.margin = '0 auto';
    svgContainer.addEventListener('dragstart', this.startSelection);

    svgContainer.addEventListener('mouseup', (e) => {
      svgContainer.removeEventListener('mousemove', this.generateSelection);
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('piano-roll-svg');

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '150');

    // Append the SVG to the card container
    cardDiv.appendChild(svgContainer);
    svgContainer.appendChild(svg);
    this.divCollection.push(cardDiv);

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

  selectPianoRoll(e) {
    const self = csvToSVG;

    // Restore previous params for Piano Roll no longer selected
      if (self.selected) {
        self.restoreParams();
      }

      const cardDiv = self.selected = this;
      const svgContainer = self.svgContainer = cardDiv.children[1];
      const rollId = Number(cardDiv.getAttribute('id'));
      const svg = svgContainer.children[0];
      const pianoRollContainer = document.getElementById('pianoRollContainer');

      // Prepare Piano Rolls Container to show expanded Piano Roll Card
      pianoRollContainer.innerHTML = '';
      pianoRollContainer.classList.remove('grid-view');
      pianoRollContainer.classList.add('main-piano-roll-view');
      
      // Split Piano Roll Container in 2 columns
      const colSx = document.createElement('div');
      const colDx = document.createElement('div');
      colSx.classList.add('col-sx');
      colDx.classList.add('col-dx');

      // Add style to Piano Roll Card expanded
      cardDiv.classList.add('piano-roll-card-expanded');
      cardDiv.classList.remove('piano-roll-card-thumb');
      cardDiv.style.margin = '0';

      // Make Piano Roll SVG bigger
      svgContainer.style.width = '95%';
      svg.setAttribute('height', '300');
      svg.setAttribute('width', '100%');
      
      // Append Piano Roll Card to Sx Col
      colSx.appendChild(cardDiv);

      // Append not selected Piano Roll Cards to Dx Col
      self.populateDxCol(rollId, colDx);

      // Append columns to Piano Rolls Container
      pianoRollContainer.appendChild(colSx);
      pianoRollContainer.appendChild(colDx);
  }

  generateSelection(e) {
    const self = csvToSVG;
    const notesCollection = [];
    const selectedNotes = [];
    const svgElements = self.svgContainer.children[0].children;
    self.selection.style.width = `${((e.clientX - self.start - self.svgContainerX) / self.svgContainer.getBoundingClientRect().width) * 100}%`;
    for (let i = 0; i < svgElements.length; i++) {
      if (svgElements[i].getAttribute('class') === 'note-rectangle') {
        notesCollection.push(svgElements[i]);
      }
    }

    const startPerc = self.start / self.svgContainer.getBoundingClientRect().width;
    const endPerc = (e.clientX - self.svgContainerX) / self.svgContainer.getBoundingClientRect().width;
    notesCollection.forEach((note) => {
      const x = Number(note.getAttribute('x'));
      const width = Number(note.getAttribute('width'));
      if ((x + width) > startPerc && x < endPerc) selectedNotes.push(note);
      console.log(selectedNotes); 
    });
  }

  startSelection(e) {
    const self = csvToSVG;
    e.preventDefault();
    self.svgContainerX = self.svgContainer.getBoundingClientRect().x;
    self.selected.removeEventListener('click', self.selectPianoRoll);
    self.start = e.clientX - self.svgContainerX;
    
    self.selection = document.createElement('div');
    self.selection.classList.add('selection');
    self.selection.style.left = `${(self.start / self.svgContainer.getBoundingClientRect().width) * 100}%`;
    self.svgContainer.appendChild(self.selection);
    self.svgContainer.addEventListener('mousemove', self.generateSelection)
  }

  restoreParams() {

    this.selected.classList.remove('piano-roll-card-expanded');
    this.selected.classList.add('piano-roll-card-thumb');
    const index = Number(this.selected.getAttribute('id'));
    this.selected.children[1].style.width = '80%';
    this.selected.addEventListener('click', this.selectPianoRoll);
    const collection = Array.from(this.selected.children[1].children)
    for (let i = 0; i < collection.length; i++) {
      const child = collection[i];
      if (i === 0) {
        child.setAttribute('height', '150');
        child.setAttribute('width', '100%');
      } else {
        this.selected.children[1].removeChild(child);
      }
    }
    
    this.divCollection = [...this.divCollection.slice(0, index), this.selected, ...this.divCollection.slice(index)];
  }

  populateDxCol(rollId, colDx) {

    // Remove selected Piano Roll card from cards' collection
    this.divCollection.splice(rollId, 1);

    // Add style to remaining not selected Piano Roll cards and append them to Dx Col
    this.divCollection.forEach((element, index) => {

      if (index === 0) {
        element.style.margin = '0 10px';
      } else {
        element.style.margin = '10px';
      }

      element.classList.add('piano-roll-card-thumb');
      
      colDx.appendChild(element);
    });
  }
}

document.getElementById('loadCSV').addEventListener('click', async () => {
  csvToSVG = new PianoRollDisplay();
  csvToSVG.divCollection = [];
  await csvToSVG.generateSVGs();
});
