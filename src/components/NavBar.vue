<script setup lang="ts">
const color = ref('black')
function preload() {
  const Image = document.createElement('img')
  Image.src = '/black.png'
}

const Blog = computed(() => '博客')
onMounted(preload)
</script>

<template>
  <header class="header z-40">
    <router-link
      w-30 absolute lg:fixed my6 mx15 lt-md:mx4 select-none outline-none to="/" focusable="false"
      class="signature"
    >
      <Logo />
    </router-link>
    <nav class="nav">
      <div class="spacer" />
      <div class="right">
        <router-link to="/posts" title="Blog">
          <span class="lt-md:hidden BlogMove" :style="`--blog:'${Blog}'`"> 博客
            <div class="white" />
          </span>
          <div i-clarity:book-solid md:hidden />
        </router-link>
        <router-link to="/projects" title="Projects">
          <span class="lt-md:hidden projectMove"><span style="--delay: 0s">项</span><span
            style="--delay: 0.1s"
          >目</span></span>
          <div i-iwwa:power class="md:hidden iconMove" />
          <span icon="fa" />
        </router-link>
        <a href="https://github.com/Aaronwn" target="_blank" title="GitHub">
          <svg class="svg-dash" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
              d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2c2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2a4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6c-.6.6-.6 1.2-.5 2V21"
            />
          </svg>
        </a>
        <toggle-theme />
      </div>
    </nav>
  </header>
</template>

<style scoped>
.brightness {
  filter: brightness(1500%);
}

.boxshadow {
  box-shadow: rgba(0, 0, 0, 0.17) 0px -23px 25px 0px inset,
    rgba(0, 0, 0, 0.15) 0px -36px 30px 0px inset,
    rgba(0, 0, 0, 0.1) 0px -79px 40px 0px inset, rgba(0, 0, 0, 0.06) 0px 2px 1px,
    rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px,
    rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px;
}

.header h1 {
  margin-bottom: 0;
}

.logo {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
}

.nav {
  padding: 2rem;
  width: 100%;
  display: grid;
  grid-template-columns: auto max-content;
  box-sizing: border-box;
}

.nav>* {
  margin: auto;
}

.nav img {
  margin-bottom: 0;
}

.nav a {
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
  opacity: 0.6;
  outline: none;
}

.nav a:hover {
  opacity: 1;
  text-decoration-color: inherit;
}

.nav .right {
  display: grid;
  grid-gap: 1.2rem;
  grid-auto-flow: column;
}

.nav .right>* {
  margin: auto;
}

.projectMove>span {
  position: relative;
  animation: bounce 0.5s ease infinite alternate;
}

.projectMove>span:nth-child(1n + 0) {
  animation-delay: var(--delay);
}

@keyframes bounce {
  100% {
    top: -2px;
    font-weight: bold;
  }
}

.iconMove {
  animation: iconMove 1s ease-in-out infinite alternate;
}

@keyframes iconMove {
  100% {
    transform: rotate(360deg);
  }
}

.BlogMove {
  position: relative;
}

.white {
  position: absolute;
  left: 0;
  width: 80%;
  height: 3px;
  z-index: 4;
  animation: whiteMove 3s ease-out infinite;
}

.BlogMove::before {
  width: 100%;
  content: var(--blog);
  position: absolute;
  top: 0;
  left: 0.5px;
  height: 0px;
  color: v-bind(color);
  overflow: hidden;
  z-index: 2;
  animation: redShadow 2s ease-in infinite;
  filter: contrast(200%);
  text-shadow: 1px 0 0 #eee;
}

@keyframes redShadow {
  20% {
    height: 32px;
  }

  60% {
    height: 6px;
  }

  100% {
    height: 42px;
  }
}

@keyframes whiteMove {
  8% {
    top: 38px;
  }

  14% {
    top: 8px;
  }

  20% {
    top: 42px;
  }

  32% {
    top: 2px;
  }

  99% {
    top: 30px;
  }
}

:deep(.svg-dash) {
  animation: draw 10s linear infinite;
}

:deep(.svg-dash):active {
  animation: rotate 1s linear forwards;
}

@keyframes draw {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }

  to {
    stroke-dasharray: 1000;
    stroke-dashoffset: 0;
  }
}

@keyframes rotate {
  from {
    transform: rotate3d(0, 0, 0, 0deg);
  }

  to {
    transform: rotate3d(0, 0, 1, 45deg);
  }
}
</style>
