import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HeroSlide {
  image: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-hero-swiper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-swiper.component.html',
  styleUrls: ['./hero-swiper.component.css']
})
export class HeroSwiperComponent {
  @Input() slides: HeroSlide[] = [
    { image: '/slider/slide_normal.01750261896bd9890fb7f8f48371c90a.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.091a5930773f34be93648b99e78f77d4.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.0c0f05d040ba7287e35c2c743f1c4789.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.14e59b5608a0aaf1c31c0f60f96e9ed0.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.16dab2368a2566b5ce3470a16dcc628f.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.2f4866ec49ac97550b60405ae810ffda.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.3eaeefac847a5e6ebe019e798c2af9d0.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.4960aadacb682a7325d36846a194b266.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.5ccb76eaca26f272f3118254e9144fa9.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.877743ead65d1d754e01474f9c88dfe2.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.9b9ff4a38fa614a13dc5e04b5c7b15fa.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.bca56e79918db843f06d4aabc62e87cc.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.be0264b14e904fe636c59d5ec92ae4d2.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.d94333c368484a2e47c666d5546d362d.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.db97562918bc712743a12207e2d23c10.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.f3a89b97a30442ee1d27fc5fba6caa46.jpg', title: '', description: '' },
    { image: '/slider/slide_normal.f7ce9965c149e047cb848185f5831cf4.jpg', title: '', description: '' }
  ];

  current = signal(0);

  next() {
    this.current.update(i => (i + 1) % this.slides.length);
  }

  prev() {
    this.current.update(i => (i - 1 + this.slides.length) % this.slides.length);
  }

  goTo(index: number) {
    this.current.set(index);
  }
}
