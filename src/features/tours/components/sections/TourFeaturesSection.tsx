import { motion } from "framer-motion";
import { IconSparkles } from "@tabler/icons-react";

interface TourFeaturesSectionProps {
  data: any;
  viewMode: 'desktop' | 'mobile';
}

export function TourFeaturesSection({ data, viewMode }: TourFeaturesSectionProps) {
  const features = data.features || [];

  return (
    <section className={viewMode === 'mobile' ? 'pt-4 pb-8 bg-white' : 'pt-8 pb-16 bg-white'}>
      <div className={viewMode === 'mobile' ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={viewMode === 'mobile' ? 'text-center mb-6' : 'text-center mb-8'}
        >
          <h2 className={viewMode === 'mobile' ? 'text-2xl font-bold text-morandi-primary' : 'text-4xl font-bold text-morandi-primary'}>
            行程特色
          </h2>
        </motion.div>

        <div className={viewMode === 'mobile' ? 'space-y-4' : 'grid grid-cols-2 md:grid-cols-3 gap-6'}>
          {features.map((feature: any, index: number) => {
            const FeatureIcon = feature.iconComponent || IconSparkles;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                <div className={viewMode === 'mobile' ? 'relative bg-white rounded-2xl p-4 h-full flex items-center gap-4' : 'relative bg-white rounded-2xl p-6 h-full'}>
                  <div className={viewMode === 'mobile' ? 'w-12 h-12 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0' : 'w-14 h-14 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl flex items-center justify-center mb-4'}>
                    <FeatureIcon className={viewMode === 'mobile' ? 'w-6 h-6 text-amber-600' : 'w-7 h-7 text-amber-600'} />
                  </div>
                  <div className={viewMode === 'mobile' ? 'flex-1 min-w-0' : ''}>
                    <h3 className={viewMode === 'mobile' ? 'font-bold text-base mb-1 text-morandi-primary' : 'font-bold text-lg mb-2 text-morandi-primary'}>{feature.title}</h3>
                    <p className="text-sm text-morandi-secondary">{feature.description}</p>
                  </div>
                  {viewMode !== 'mobile' && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                      <IconSparkles className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
