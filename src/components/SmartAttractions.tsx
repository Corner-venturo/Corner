"use client";

import { FocusCards } from "@/components/ui/focus-cards";
import { motion } from "framer-motion";
import Image from "next/image";

interface Attraction {
  title: string;
  src: string;
  description?: string;
}

export function SmartAttractions({ attractions }: { attractions: Attraction[] }) {
  const count = attractions.length;

  // 1個景點 - 全寬英雄卡片
  if (count === 1) {
    const item = attractions[0];
    return (
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative h-[500px] rounded-3xl overflow-hidden"
        >
          <Image
            src={item.src}
            alt={item.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <h3 className="text-5xl font-bold text-white mb-4">{item.title}</h3>
            {item.description && (
              <p className="text-xl text-white/80">{item.description}</p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // 2個景點 - 左右對稱大卡片
  if (count === 2) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {attractions.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] rounded-3xl overflow-hidden group"
            >
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-3xl font-bold text-white mb-2">{item.title}</h3>
                {item.description && (
                  <p className="text-white/80">{item.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 3個景點 - 三等分卡片
  if (count === 3) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          {attractions.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative h-[350px] rounded-2xl overflow-hidden group"
            >
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-white/80 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // 4-6個景點 - 使用 FocusCards
  if (count >= 4 && count <= 6) {
    return <FocusCards cards={attractions} />;
  }

  // 7個以上 - 橫向滾動
  return (
    <div className="max-w-full">
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-6 px-4 md:px-8" style={{ width: "max-content" }}>
          {attractions.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="relative w-[300px] h-[400px] rounded-2xl overflow-hidden group flex-shrink-0"
            >
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-white/80 mt-2">{item.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {/* 滾動指示器 */}
      <div className="flex justify-center mt-4">
        <div className="flex gap-2">
          {[...Array(Math.ceil(count / 3))].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-400"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
