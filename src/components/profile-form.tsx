"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import Image from "next/image";
import { Label } from "./ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const profileFormSchema = z.object({
  username: z.string().min(3, "Este campo debe tener minimo 3 caractere."),
  full_name: z.string().min(3, "Este campo debe tener minimo 3 caracteres."),
  profile_url: z.string().url("Invalid URL format").optional(),
  avatar: z.string(),
  onboarding: z.boolean(),
});

export interface ProfileType extends z.infer<typeof profileFormSchema> {
  id: string;
}

export interface ProfileFormProps {
  profile: ProfileType;
}

const avatars = [
  {
    id: "1",
    name: "sofia",
    image: "/assets/characters-preview/sofia.png",
  },
  {
    id: "2",
    name: "luis",
    image: "/assets/characters-preview/luis.png",
  },
];

export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: profile.username,
      full_name: profile.full_name,
      profile_url: profile.profile_url,
      avatar: profile.avatar,
      onboarding: profile.onboarding ?? false,
    },
  });

  const onSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ ...data, onboarding: true })
      .eq("id", profile?.id);

    if (error) {
      console.error("Error updating profile:", error);
      return;
    }

    window.location.reload();
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md ">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de Usuario</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ingreasa tu nombre de usuario"
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario de Twitch</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    readOnly
                    placeholder="Enter your username"
                    className="w-full bg-gray-100 cursor-not-allowed"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar</FormLabel>
                <FormControl>
                  <RadioGroup
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    className="w-full h-full flex gap-4"
                  >
                    {avatars.map((avatar) => (
                      <div
                        key={avatar.id}
                        className="flex flex-col items-center"
                      >
                        <Label htmlFor={avatar.id}>
                          <div className="flex flex-col items-center space-y-2">
                            <Image
                              src={avatar.image}
                              alt={avatar.name}
                              width={40}
                              height={40}
                            />
                            {avatar.name}
                          </div>
                        </Label>
                        <RadioGroupItem value={avatar.name} id={avatar.id} />
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className=" w-full">
            Guardar
          </Button>
        </form>
      </Form>
    </div>
  );
};
