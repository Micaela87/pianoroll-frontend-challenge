export default class PianoRollEventsService {

    divCollection = [];
    selected = null;
    selection = null;
    start = null;
    svgContainerX = null;

    constructor() {};

    selectPianoRoll = (e) => {

        // Restore previous params for Piano Roll no longer selected
        if (this.selected) {
            this.restoreParams();
        }

        const cardDiv = this.selected = e.currentTarget;
        const svgContainer = this.svgContainer = cardDiv.children[1];
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
        cardDiv.removeEventListener('click', this.selectPianoRoll);

        // Make Piano Roll SVG bigger
        svgContainer.classList.add('svg-container-expanded');
        svg.setAttribute('height', '300');
        svg.setAttribute('width', '100%');

        // Add drag events to selected svgContainer
        svgContainer.setAttribute('draggable', 'true');
        svgContainer.addEventListener('dragstart', this.startSelection);
        svgContainer.addEventListener('mouseup', this.endSelection);
        
        // Append Piano Roll Card to Sx Col
        colSx.appendChild(cardDiv);

        // Append not selected Piano Roll Cards to Dx Col
        this.populateDxCol(rollId, colDx);

        // Append columns to Piano Rolls Container
        pianoRollContainer.appendChild(colSx);
        pianoRollContainer.appendChild(colDx);
  }

  startSelection = (e) => {
    e.preventDefault();

    // Calculates starting point for selection
    this.svgContainerX = this.svgContainer.getBoundingClientRect().x;
    this.start = e.clientX - this.svgContainerX;

    // Removes click event so that it doesn't interfere with drag event
    this.selected.removeEventListener('click', this.selectPianoRoll);
    
    // Creates selection element and appends it to svgContainer
    this.selection = document.createElement('div');
    this.selection.classList.add('selection');
    this.selection.style.left = `${(this.start / this.svgContainer.getBoundingClientRect().width) * 100}%`;
    this.svgContainer.appendChild(this.selection);

    // Add mousemove event to select notes
    this.svgContainer.addEventListener('mousemove', this.generateSelection)
  }

  endSelection = (e) => {

    // Create btn to delete selection
    const button = document.createElement('button');
    button.innerText = 'X';
    button.classList.add('remove-selection-btn');
    button.addEventListener('click', (e) => {
      this.svgContainer.removeChild(button.parentElement);
    });

    // Avoid more than 1 btn to be appended to selection
    if (Array.from(this.selection.children).length === 0) {
      this.selection.appendChild(button);
    }
    
    // Remove mousemove event to prevent useless operations on svgContainer
    this.svgContainer.removeEventListener('mousemove', this.generateSelection);
  }

  restoreParams() {
    // Toggle classes
    this.selected.classList.remove('piano-roll-card-expanded');
    this.selected.classList.add('piano-roll-card-thumb');
    const svgContainer = this.selected.children[1];
    svgContainer.classList.remove('svg-container-expanded');
    
    // Add click event to make Piano Roll selectable again
    this.selected.addEventListener('click', this.selectPianoRoll);

    // Remove dragstart event and attributes
    svgContainer.removeEventListener('dragstart', this.startSelection);
    svgContainer.removeEventListener('mouseup', this.endSelection);
    svgContainer.setAttribute('draggable', 'false');

    // Remove note selections
    const collection = Array.from(this.selected.children[1].children);
    for (let i = 0; i < collection.length; i++) {
      const child = collection[i];
      if (i === 0) {
        child.setAttribute('height', '150');
        child.setAttribute('width', '100%');
      } else {
        this.selected.children[1].removeChild(child);
      }
    }
    
    // Insert Piano Roll no longer selected in the Dx col
    const index = Number(this.selected.getAttribute('id'));
    this.divCollection = [...this.divCollection.slice(0, index), this.selected, ...this.divCollection.slice(index)];
  }

  generateSelection = (e) => {
    const notesCollection = [];
    const selectedNotes = [];
    const svgElements = this.svgContainer.children[0].children;
    this.selection.style.width = `${((e.clientX - this.start - this.svgContainerX) / this.svgContainer.getBoundingClientRect().width) * 100}%`;
    for (let i = 0; i < svgElements.length; i++) {
      if (svgElements[i].getAttribute('class') === 'note-rectangle') {
        notesCollection.push(svgElements[i]);
      }
    }

    const startPerc = this.start / this.svgContainer.getBoundingClientRect().width;
    const endPerc = (e.clientX - this.svgContainerX) / this.svgContainer.getBoundingClientRect().width;
    notesCollection.forEach((note) => {
      const x = Number(note.getAttribute('x'));
      const width = Number(note.getAttribute('width'));
      if ((x + width) > startPerc && x < endPerc) selectedNotes.push(note);
      console.log(selectedNotes); 
    });
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