import lerp from 'lerp';
import { Matrix4, Vector3, Quaternion } from 'three';
// import numeric from 'numeric';
import numeric from './assets/scripts/numeric.js';
import { cats } from './assets/data/cats.json';
import poozyCats from './assets/poozycats-banner.png';
import './css/fonts.scss';
import './css/index.scss';

let images;
let width;
let height;
let TL1;
let TR1;
let BR1;
let BL1;

let width2;
let height2;

let firstScroll = true;
let scrollMessage;
let scrollContainer;
let scrollContent;
let scrollPercent;
let index = 0;
let previndex = null;
let percent = 0;
let value = null;
let loader = null;
let loaderMessage = null;
let loaded = 0;
let skipLoading = false;

let catNames;
let catNamesScroll;

let credits;

const loadImage = cat => new Promise((resolve) => {
  cat.image = document.createElement('img');
  cat.image.addEventListener('load', () => {
    cat.width = cat.image.width;
    cat.height = cat.image.height;
    loaded += 1;
    loaderMessage.innerText = `loading ${loaded} of ${cats.length} cats... please be patient :)`;
    resolve();
  });
  cat.image.src = `images/${cat.file}`;
});

// async function loadAllCats() {
//   for (const cat of cats) {
//     await loadImage(cat);
//   }
// }


const getTransform = (from, to) => {
  let i;
  let k;
  let l;

  const A = [];
  for (i = k = 0; k < 4; i = k += 1) {
    A.push([from[i].x, from[i].y, 1, 0, 0, 0, -from[i].x * to[i].x, -from[i].y * to[i].x]);
    A.push([0, 0, 0, from[i].x, from[i].y, 1, -from[i].x * to[i].y, -from[i].y * to[i].y]);
  }
  const b = [];
  for (i = l = 0; l < 4; i = l += 1) {
    b.push(to[i].x);
    b.push(to[i].y);
  }
  // the main equation is here:

  const h = numeric.solve(A, b);
  return [[h[0], h[1], 0, h[2]], [h[3], h[4], 0, h[5]], [0, 0, 1, 0], [h[6], h[7], 0, 1]];
};

const update = () => {
  index = Math.floor(value);
  percent = value - index;

  if (index !== previndex) {
    const { label } = cats[index];
    if (previndex || previndex === 0) cats[previndex].label.classList.remove('active');
    label.classList.add('active');
    const offset = -(label.offsetLeft - (window.innerWidth / 2) + (label.getBoundingClientRect().width / 2));
    catNamesScroll.style.transform = `translateX(${offset}px)`;
    images.innerHTML = '';
    width = cats[index].image.width;
    height = cats[index].image.height;
    width2 = cats[index].image.width;
    height2 = cats[index].image.width;
    const position1 = cats[index + 1].pos;

    if (!position1.TL) console.log(`can't get cat position: ${index}`);

    TL1 = position1.TL;
    TR1 = position1.TR;
    BR1 = position1.BR;
    BL1 = position1.BL;

    const image1 = cats[index + 1].image;
    const image2 = cats[index + 0].image;
    image1.className = 'image1';
    image2.className = 'image2';
    images.appendChild(image1);
    images.appendChild(image2);
  }

  const from1 = [{ x: 0, y: 0 }, { x: 0, y: height }, { x: width, y: 0 }, { x: width, y: height }];
  const to1 = [{ x: lerp(0, TL1.x, percent), y: lerp(0, TL1.y, percent) }, { x: lerp(0, BL1.x, percent), y: lerp(height, BL1.y, percent) }, { x: lerp(width, TR1.x, percent), y: lerp(0, TR1.y, percent) }, { x: lerp(width, BR1.x, percent), y: lerp(height, BR1.y, percent) }];
  const trans1 = getTransform(from1, to1);
  const transform1 = [];
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      transform1.push(trans1[j][i]);
    }
  }

  const from2 = [{ x: TL1.x, y: TL1.y }, { x: BL1.x, y: BL1.y }, { x: TR1.x, y: TR1.y }, { x: BR1.x, y: BR1.y }];
  const to2 = [{ x: lerp(TL1.x, 0, (1 - percent)), y: lerp(TL1.y, 0, (1 - percent)) }, { x: lerp(BL1.x, 0, (1 - percent)), y: lerp(BL1.y, height, (1 - percent)) }, { x: lerp(TR1.x, width, (1 - percent)), y: lerp(TR1.y, 0, (1 - percent)) }, { x: lerp(BR1.x, width, (1 - percent)), y: lerp(BR1.y, height, (1 - percent)) }];
  const trans2 = getTransform(from2, to2);
  const transform2 = [];
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      transform2.push(trans2[j][i]);
    }
  }

  // TODO: if we want to correct for rotation as well we could use the quaternion below
  const pos1 = new Vector3();
  const scale1 = new Vector3();
  const matrix1 = new Matrix4().fromArray(transform1);
  matrix1.decompose(pos1, new Quaternion(), scale1);

  const pos2 = new Vector3();
  const scale2 = new Vector3();
  const matrix2 = new Matrix4().fromArray(transform2);
  matrix2.decompose(pos2, new Quaternion(), scale2);

  cats[index + 0].image.style.opacity = 1 - percent;

  cats[index + 0].image.style.transform = `matrix3d(${transform1.join(',')})`;
  cats[index + 1].image.style.transform = `matrix3d(${transform2.join(',')})`;

  // TODO: we can get the average point for each photo via getBoundingClientRect
  // and lerp one photo to the next and offset the container again based on that
  // number to keep the center point in the middle of the screen on each frame
  const x = (window.innerWidth / 2) - (lerp(pos1.x + ((cats[index + 0].width * scale1.x) / 2), pos2.x + ((cats[index + 1].width * scale2.x) / 2), percent));
  const y = (window.innerHeight / 2) - (lerp(pos1.y + ((cats[index + 0].height * scale1.y) / 2), pos2.y + ((cats[index + 1].height * scale2.y) / 2), percent));

  images.style.transform = `translate(${x}px,${y}px)`;

  previndex = index;
};

const scrolled = () => {
  if (firstScroll) {
    scrollMessage.classList.add('hidden');
    firstScroll = false;
  }
  const { innerHeight } = window;
  const { scrollTop } = scrollContainer;
  // const { length } = cats;
  scrollPercent = scrollTop / ((loaded * innerHeight) - innerHeight);
  value = (scrollPercent * (loaded - 2));

  if (credits.classList.contains('open')) credits.classList.remove('open');

  update();
};

const resize = () => {
  scrollContent.style.height = `${window.innerHeight * loaded}px`;
  const width1 = cats[index + 0].image.getBoundingClientRect().width / 2;
  const height1 = cats[index + 0].image.getBoundingClientRect().height / 2;
  const { innerWidth, innerHeight } = window;
  images.style.transform = `translate(${innerWidth / 2 - (lerp(width1, width2, percent))}px, ${(innerHeight / 2) - lerp(height1, height2, percent)}px)`;
  const { label } = cats[index];
  const offset = -(label.offsetLeft - (window.innerWidth / 2) + (label.getBoundingClientRect().width / 2));
  catNamesScroll.style.transform = `translateX(${offset}px)`;
};

const showCredits = () => {
  credits.classList[credits.classList.contains('open') ? 'remove' : 'add']('open');
};


async function init() {
  images = document.createElement('div');
  images.className = 'images';
  document.body.appendChild(images);

  scrollContainer = document.createElement('div');
  scrollContent = document.createElement('div');
  scrollContainer.className = 'scrollContainer';
  scrollContent.className = 'scrollContent';
  scrollContainer.appendChild(scrollContent);
  document.body.appendChild(scrollContainer);

  catNames = document.createElement('div');
  catNames.className = 'names';
  document.body.appendChild(catNames);

  catNamesScroll = document.createElement('div');
  catNamesScroll.className = 'names-scroll';
  catNames.appendChild(catNamesScroll);

  scrollMessage = document.createElement('div');
  scrollMessage.className = 'scroll-message';
  scrollMessage.innerHTML = '<p>please scroll</p>';
  document.body.appendChild(scrollMessage);

  credits = document.createElement('div');
  // const icpLogo = document.createElement('img');
  const creditsTitle = document.createElement('h1');
  const creditsText = document.createElement('p');
  const creditsSource = document.createElement('p');
  creditsTitle.innerText = 'what the heck is this?';
  creditsText.innerHTML = 'CatDive is an interactive visualization based on the work of Mike Stanfill at:<br>'
    + `<a target="_blank" href="http://poozycat.com/"><img src="${poozyCats}"/></a><br>`
    + 'By collecting and curating photos of cats looking at cats he created the <i>Infinite Cat Project</i>, '
    + 'which became an internet sensation and one of the longest running websites in history.<br><br>'
    + 'CatDive uses OpenCV to <a target="_blank" href="https://opencv-python-tutroals.readthedocs.io/en/latest/py_tutorials/py_feature2d/py_feature_homography/py_feature_homography.html">detect</a> each image inside of the next and <a target="_blank" href="http://jsfiddle.net/dFrHS/1/">CSS Transformation Matrices</a> to smoothly transition between them';
  creditsSource.innerHTML = 'An <a target="_blank" href="https://gitlab.com/daveseidman/catdive">open source</a> project by <a target="_blank" href="http://daveseidman.com">Dave Seidman</a>';
  credits.className = 'credits';
  credits.appendChild(creditsTitle);
  credits.appendChild(creditsText);
  credits.appendChild(creditsSource);
  credits.addEventListener('click', showCredits);
  document.body.appendChild(credits);

  loader = document.createElement('div');
  loaderMessage = document.createElement('p');
  loader.className = 'loader';
  loaderMessage.className = 'loader-message';
  loader.appendChild(loaderMessage);
  const skipButton = document.createElement('button');
  skipButton.className = 'skip';
  skipButton.innerText = 'I can\'t wait!';
  skipButton.addEventListener('click', () => { skipLoading = true; });
  loader.appendChild(skipButton);
  document.body.appendChild(loader);

  for (const cat of cats) {
    if (skipLoading) break;
    await loadImage(cat);
  }

  scrollContent.style.height = `${window.innerHeight * (cats.length - 2)}px`;
  scrollContainer.addEventListener('scroll', scrolled);

  for (let i = 0; i < cats.length - 1; i += 1) {
    cats[i].label = document.createElement('p');
    cats[i].label.innerHTML = `<a target="_blank" href="${cats[i + 1].url}"><span class="catName">${cats[i + 1].name}</span><span> is looking at </span><span class="catName">${cats[i].name}</span></a>`;
    catNamesScroll.appendChild(cats[i].label);
  }

  loader.classList.add('hidden');
  window.addEventListener('resize', resize);
  resize();
  update();
}

init();
