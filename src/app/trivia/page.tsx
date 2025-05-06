// app/trivia/page.tsx
'use client'; // Necesario para hooks como useState, useEffect, useRouter

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Para leer query params
import Button from '@/components/ui/Button'; // Ajusta la ruta si es necesario
// import useUserStore from '@/lib/store/userStore'; // Descomentar cuando el store esté listo
// import { getTriviaQuestion, submitTriviaAnswer } from '@/lib/services/api'; // Descomentar para la lógica real

// Tipo para la pregunta de trivia (lo expandirás)
interface TriviaQuestion {
    id: string;
    category: string; // Ej: 'Ahorro', 'Tarjeta', etc.
    questionText: string;
    options: string[];
    // correctAnswerIndex: number; // Esto no se debería enviar al cliente
}

// Tipo para la respuesta de la API (ejemplo)
// interface TriviaApiResponse extends TriviaQuestion {
//     // Podríamos añadir más campos si la API los devuelve
// }

export default function TriviaPage() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Para leer query params como totemId o categoryId

    const [question, setQuestion] = useState<TriviaQuestion | null>(null);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Para mostrar un loader mientras carga
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // const { user, setPuntos, addCollectedItem } = useUserStore(); // Ejemplo de uso del store

    // Simular la carga de una pregunta al montar el componente
    useEffect(() => {
        const totemIdFromQuery = searchParams.get('totemId'); // Ejemplo de cómo podrías obtener el tótem/categoría
        const categoryFromQuery = searchParams.get('category');

        console.log('Cargando trivia para Totem ID:', totemIdFromQuery, 'o Categoría:', categoryFromQuery);
        setIsLoading(true);

        // --- SIMULACIÓN DE CARGA DE PREGUNTA (Reemplazar con llamada API en Día 2+) ---
        setTimeout(() => {
            // Aquí se hara la llamada a `getTriviaQuestion(totemIdFromQuery)`
            const mockQuestion: TriviaQuestion = {
                id: 'trivia123',
                category: categoryFromQuery || 'Ahorro', // Tomar de query o default
                questionText: '¿Cuál es el principal beneficio de una cuenta de ahorros programados en BAC?',
                options: [
                    'Generar intereses altos a corto plazo.',
                    'Acceder a créditos de forma inmediata.',
                    'Cumplir metas de ahorro específicas a mediano o largo plazo.',
                    'Realizar pagos internacionales sin costo.',
                ],
            };
            setQuestion(mockQuestion);
            setIsLoading(false);
        }, 1000); // Simular delay de red
        // --- FIN SIMULACIÓN ---

    }, [searchParams]);

    const handleOptionSelect = (index: number) => {
        if (isSubmitting || feedbackMessage) return; // No permitir cambiar si ya se envió o hay feedback
        setSelectedOptionIndex(index);
    };

    const handleSubmitAnswer = async () => {
        if (selectedOptionIndex === null || !question) {
            alert('Por favor, selecciona una opción.');
            return;
        }

        setIsSubmitting(true);
        setFeedbackMessage(null);

        // --- SIMULACIÓN DE ENVÍO DE RESPUESTA (Reemplazar con llamada API en Día 2+) ---
        console.log(`Respuesta enviada: Opción ${selectedOptionIndex} para pregunta ${question.id}`);
        setTimeout(() => {
            // Aquí hara la llamada a `submitTriviaAnswer(question.id, selectedOptionIndex)`
            // y según la respuesta (correcta/incorrecta) actualizas el store y muestras feedback
            const isCorrect = selectedOptionIndex === 2; // Ejemplo: la opción C es la correcta

            if (isCorrect) {
                // setPuntos(user.puntos + 3); // Ejemplo de actualizar store
                // addCollectedItem({ category: question.category, totemId: ... });
                setFeedbackMessage('¡Correcto! Ganaste 3 puntos.');
                // Navegar a página de acierto o directamente al perfil después de un delay
                setTimeout(() => router.push('/profile'), 2000); // O a una página de "Acierto"
            } else {
                setFeedbackMessage('¡Incorrecto! Intenta con otro tótem.');
                // Aquí aplicaría la lógica de "Espera 5 minutos" para este tótem en el backend/store
                // Navegar a página de desacierto o directamente al perfil después de un delay
                setTimeout(() => router.push('/profile'), 2000); // O a una página de "Desacierto"
            }
            setIsSubmitting(false);
        }, 1500);
        // --- FIN SIMULACIÓN ---
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl text-gray-700">Cargando trivia...</p>
                {/* Aquí podrías poner un spinner/loader */}
            </div>
        );
    }

    if (!question) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl text-red-500">No se pudo cargar la pregunta de trivia.</p>
                <Button onClick={() => router.push('/profile')} className="mt-4">Volver al Perfil</Button>
            </div>
        );
    }

    // Placeholder para el icono de la categoría (basado en el documento Guía de Desarrollo)
    const categoryIcons: { [key: string]: string } = {
        'Ahorro': '🐷',
        'Tarjeta': '💳',
        'Casa': '🏠',
        'Carro': '🚗',
        // Añadir más si es necesario
    };
    const categoryIcon = categoryIcons[question.category] || '❓';


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-lg">
                <div className="text-center mb-6">
                    <span className="text-5xl mb-2 inline-block">{categoryIcon}</span>
                    <h1 className="text-xl sm:text-2xl font-bold text-red-700">
                        Trivia BAC: {question.category}
                    </h1>
                </div>

                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <p className="text-md sm:text-lg text-gray-800 leading-relaxed">
                        {question.questionText}
                    </p>
                </div>

                <div className="space-y-3 mb-8">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            disabled={isSubmitting || !!feedbackMessage}
                            className={`
                w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all duration-150
                ${selectedOptionIndex === index
                                ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-400'
                            }
                ${(isSubmitting || !!feedbackMessage) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
              `}
                        >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span> {/* A, B, C, D */}
                            {option}
                        </button>
                    ))}
                </div>

                {feedbackMessage && (
                    <p className={`mb-4 text-center font-semibold ${feedbackMessage.includes('Correcto') ? 'text-green-600' : 'text-red-600'}`}>
                        {feedbackMessage}
                    </p>
                )}

                {!feedbackMessage && (
                    <Button
                        onClick={handleSubmitAnswer}
                        disabled={selectedOptionIndex === null || isSubmitting}
                        isLoading={isSubmitting}
                        className="w-full text-lg py-3"
                    >
                        Enviar Respuesta
                    </Button>
                )}
                {feedbackMessage && (
                    <Button
                        onClick={() => router.push('/profile')} // O a /jugar si quieres que intente otro tótem
                        variant="secondary"
                        className="w-full mt-2"
                    >
                        Continuar
                    </Button>
                )}

            </div>
        </div>
    );
}