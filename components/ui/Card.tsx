import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  bordered?: boolean;
  image?: string;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  title,
  bordered = false,
  image,
  className = '',
  ...props
}, ref) => {
  const borderClass = bordered ? "border border-base-300 shadow-sm" : "shadow-xl";
  
  return (
    <div 
      ref={ref}
      className={`card bg-base-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${borderClass} ${className}`.trim()}
      {...props}
    >
      {image && (
        <figure>
          <img src={image} alt={title || "Card image"} className="w-full object-cover" />
        </figure>
      )}
      <div className="card-body">
        {title && <h2 className="card-title text-2xl font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  );
});

Card.displayName = 'Card';
