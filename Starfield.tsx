import React, { useState, useEffect } from 'react';
import './starfield.css';

interface Star {
    left: string;
    top: string;
    width: string;
    height: string;
    animationDelay: string;
    animationDuration: string;
}

const Starfield: React.FC = () => {
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        const generatedStars: Star[] = [];
        for (let i = 0; i < 100; i++) {
            const size = Math.random() * 2 + 1;
            generatedStars.push({
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 5 + 2}s`,
            });
        }
        setStars(generatedStars);
    }, []);

    return (
        <div id="starfield">
            {stars.map((star, i) => (
                <div key={i} className="star" style={star} />
            ))}
        </div>
    );
};

export default Starfield;
