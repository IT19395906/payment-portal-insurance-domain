import {Directive,Input,HostListener,ElementRef,Renderer2} from '@angular/core';

@Directive({
  selector: '[customTooltip]',
  standalone: true
})
export class TooltipDirective {
  @Input('customTooltip') tooltipText = '';
  tooltip: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltip) {
      this.tooltip = this.renderer.createElement('div');

      if (this.tooltip) {
        this.tooltip.innerHTML = this.tooltipText.replace(/\n/g, '<br/>');

        this.renderer.appendChild(document.body, this.tooltip);

        this.renderer.setStyle(this.tooltip, 'position', 'absolute');
        this.renderer.setStyle(this.tooltip, 'background', 'white');
        this.renderer.setStyle(this.tooltip, 'color', 'black');
        this.renderer.setStyle(this.tooltip, 'border', '1px solid blue')
        this.renderer.setStyle(this.tooltip, 'padding', '6px 10px');
        this.renderer.setStyle(this.tooltip, 'borderRadius', '4px');
        this.renderer.setStyle(this.tooltip, 'fontSize', '12px');
        this.renderer.setStyle(this.tooltip, 'whiteSpace', 'normal');
        this.renderer.setStyle(this.tooltip, 'zIndex', '1000');

        const rect = this.el.nativeElement.getBoundingClientRect();
        this.renderer.setStyle(this.tooltip, 'top', `${rect.bottom + window.scrollY + 15}px`);
        this.renderer.setStyle(this.tooltip, 'left', `${rect.left + window.scrollX}px`);
      }
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltip) {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = null;
    }
  }
}
